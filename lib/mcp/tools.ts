import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import { supabaseService } from '@/lib/supabaseService';
import { sendEmail } from '@/lib/email';
import { mcpDbPool } from '@/lib/mcp/pg';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

function json(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string): ToolResult {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

async function runSql(sql: string, params: unknown[] = []) {
  const pool = mcpDbPool();
  const res = await pool.query(sql, params as any[]);
  return { rowCount: res.rowCount, rows: res.rows };
}

const PAYING_STATUSES = ['active', 'trialing'];

// ---------------------------------------------------------------------------
// registration
// ---------------------------------------------------------------------------

export function registerTaxProTools(server: McpServer) {
  // -------------------------------------------------------------------------
  // Directory / read
  // -------------------------------------------------------------------------

  server.registerTool(
    'list_professionals',
    {
      title: 'List professionals',
      description:
        'Search the tax professional directory. Filters are optional and combine with AND.',
      inputSchema: z.object({
        search: z
          .string()
          .optional()
          .describe('Case-insensitive match on name, headline, or firm name'),
        credential_type: z
          .string()
          .optional()
          .describe('e.g. CPA, EA, CTEC, Other'),
        state: z.string().optional().describe('Two-letter state code the pro serves'),
        accepting_work: z.boolean().optional(),
        listed_only: z
          .boolean()
          .optional()
          .describe('Only profiles that are publicly listed (default true)'),
        limit: z.number().int().min(1).max(200).optional(),
      }),
    },
    async ({ search, credential_type, state, accepting_work, listed_only, limit }) => {
      const sb = supabaseService();
      let q = sb
        .from('profiles')
        .select(
          'id, slug, first_name, last_name, headline, firm_name, credential_type, accepting_work, is_listed, visibility_state, states, specializations, public_email, years_experience, created_at'
        )
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit ?? 50);

      if (listed_only !== false) q = q.eq('is_listed', true);
      if (credential_type) q = q.eq('credential_type', credential_type);
      if (typeof accepting_work === 'boolean') q = q.eq('accepting_work', accepting_work);
      if (state) q = q.contains('states', [state]);
      if (search) {
        const term = `%${search}%`;
        q = q.or(
          `first_name.ilike.${term},last_name.ilike.${term},headline.ilike.${term},firm_name.ilike.${term}`
        );
      }

      const { data, error } = await q;
      if (error) return fail(error.message);
      return json({ count: data?.length ?? 0, professionals: data });
    }
  );

  server.registerTool(
    'get_professional',
    {
      title: 'Get professional',
      description: 'Fetch a full profile by id or slug.',
      inputSchema: z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
      }),
    },
    async ({ id, slug }) => {
      if (!id && !slug) return fail('Provide either id or slug');
      const sb = supabaseService();
      let q = sb.from('profiles').select('*');
      q = id ? q.eq('id', id) : q.eq('slug', slug!);
      const { data, error } = await q.maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail('Profile not found');
      return json(data);
    }
  );

  server.registerTool(
    'list_firms',
    {
      title: 'List firms',
      description: 'List firm workspaces.',
      inputSchema: z.object({
        verified: z.boolean().optional(),
        subscription_status: z
          .enum(['active', 'inactive', 'past_due', 'canceled', 'trialing'])
          .optional(),
        limit: z.number().int().min(1).max(200).optional(),
      }),
    },
    async ({ verified, subscription_status, limit }) => {
      const sb = supabaseService();
      let q = sb
        .from('firms')
        .select(
          'id, name, slug, website, size_band, returns_band, verified, subscription_status, subscription_current_period_end, trial_ends_at, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(limit ?? 50);
      if (typeof verified === 'boolean') q = q.eq('verified', verified);
      if (subscription_status) q = q.eq('subscription_status', subscription_status);
      const { data, error } = await q;
      if (error) return fail(error.message);
      return json({ count: data?.length ?? 0, firms: data });
    }
  );

  server.registerTool(
    'get_firm',
    {
      title: 'Get firm',
      description: 'Fetch a firm by id or slug, including its members.',
      inputSchema: z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
      }),
    },
    async ({ id, slug }) => {
      if (!id && !slug) return fail('Provide either id or slug');
      const sb = supabaseService();
      let q = sb.from('firms').select('*');
      q = id ? q.eq('id', id) : q.eq('slug', slug!);
      const { data: firm, error } = await q.maybeSingle();
      if (error) return fail(error.message);
      if (!firm) return fail('Firm not found');

      const { data: members } = await sb
        .from('firm_members')
        .select(
          'profile_id, role, status, profiles(first_name, last_name, public_email, slug)'
        )
        .eq('firm_id', firm.id);

      return json({ firm, members: members ?? [] });
    }
  );

  server.registerTool(
    'list_jobs',
    {
      title: 'List jobs',
      description: 'List jobs on the board.',
      inputSchema: z.object({
        status: z.string().optional().describe('e.g. open, closed, draft, assigned'),
        remote_ok: z.boolean().optional(),
        created_by: z.string().optional().describe('profile id of the poster'),
        limit: z.number().int().min(1).max(200).optional(),
      }),
    },
    async ({ status, remote_ok, created_by, limit }) => {
      const sb = supabaseService();
      let q = sb
        .from('jobs')
        .select(
          'id, title, status, created_by, assigned_profile_id, payout_type, payout_fixed, payout_min, payout_max, deadline_date, remote_ok, location_states, credentials_required, specialization_keys, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(limit ?? 50);
      if (status) q = q.eq('status', status);
      if (typeof remote_ok === 'boolean') q = q.eq('remote_ok', remote_ok);
      if (created_by) q = q.eq('created_by', created_by);
      const { data, error } = await q;
      if (error) return fail(error.message);
      return json({ count: data?.length ?? 0, jobs: data });
    }
  );

  server.registerTool(
    'get_job',
    {
      title: 'Get job',
      description: 'Fetch a full job record by id.',
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const sb = supabaseService();
      const { data, error } = await sb.from('jobs').select('*').eq('id', id).maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail('Job not found');
      return json(data);
    }
  );

  server.registerTool(
    'list_job_applications',
    {
      title: 'List job applications',
      description: 'List applications, optionally filtered to one job.',
      inputSchema: z.object({
        job_id: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      }),
    },
    async ({ job_id, status, limit }) => {
      const sb = supabaseService();
      let q = sb
        .from('job_applications')
        .select(
          'id, job_id, applicant_profile_id, status, proposed_rate, proposed_payout_type, cover_note, created_at, profiles:applicant_profile_id(first_name, last_name, public_email, slug)'
        )
        .order('created_at', { ascending: false })
        .limit(limit ?? 100);
      if (job_id) q = q.eq('job_id', job_id);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) return fail(error.message);
      return json({ count: data?.length ?? 0, applications: data });
    }
  );

  // -------------------------------------------------------------------------
  // Analytics / upsell
  // -------------------------------------------------------------------------

  server.registerTool(
    'get_signup_stats',
    {
      title: 'Signup stats',
      description: 'Daily new-profile counts for the last N days (default 30).',
      inputSchema: z.object({
        days: z.number().int().min(1).max(365).optional(),
      }),
    },
    async ({ days }) => {
      const n = days ?? 30;
      const { rows } = await runSql(
        `select date_trunc('day', created_at)::date as day, count(*)::int as signups
           from profiles
          where is_deleted = false
            and created_at >= now() - ($1 || ' days')::interval
          group by 1
          order by 1 desc`,
        [n]
      );
      const total = rows.reduce((s: number, r: any) => s + Number(r.signups), 0);
      return json({ window_days: n, total_signups: total, daily: rows });
    }
  );

  server.registerTool(
    'get_conversion_funnel',
    {
      title: 'Conversion funnel',
      description:
        'High-level counts: total profiles, listed profiles, total firms, paying firms.',
      inputSchema: z.object({}),
    },
    async () => {
      const { rows } = await runSql(
        `select
           (select count(*) from profiles where is_deleted = false) as total_profiles,
           (select count(*) from profiles where is_deleted = false and is_listed) as listed_profiles,
           (select count(*) from firms) as total_firms,
           (select count(*) from firms where subscription_status = any($1)) as paying_firms,
           (select count(*) from firms where subscription_status = 'trialing') as trialing_firms`,
        [PAYING_STATUSES]
      );
      return json(rows[0]);
    }
  );

  server.registerTool(
    'get_top_upsell_targets',
    {
      title: 'Top upsell targets',
      description:
        'Profiles ranked by number of job applications submitted, excluding anyone already an active member of a paying firm. These are individuals showing strong hiring intent — good firm-workspace upsell candidates.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).optional(),
        min_applications: z.number().int().min(1).optional(),
      }),
    },
    async ({ limit, min_applications }) => {
      const { rows } = await runSql(
        `select p.id, p.slug, p.first_name, p.last_name, p.firm_name, p.public_email,
                p.credential_type, count(ja.id)::int as application_count,
                max(ja.created_at) as last_application_at
           from profiles p
           join job_applications ja on ja.applicant_profile_id = p.id
          where p.is_deleted = false
            and p.id not in (
              select fm.profile_id
                from firm_members fm
                join firms f on f.id = fm.firm_id
               where fm.status = 'active'
                 and f.subscription_status = any($1)
            )
          group by p.id
         having count(ja.id) >= $2
          order by application_count desc, last_application_at desc
          limit $3`,
        [PAYING_STATUSES, min_applications ?? 1, limit ?? 25]
      );
      return json({ count: rows.length, targets: rows });
    }
  );

  server.registerTool(
    'list_paying_customers',
    {
      title: 'List paying customers',
      description: 'Firms with an active or trialing subscription, plus their admins.',
      inputSchema: z.object({}),
    },
    async () => {
      const { rows } = await runSql(
        `select f.id, f.name, f.slug, f.subscription_status,
                f.subscription_started_at, f.subscription_current_period_end, f.trial_ends_at,
                coalesce(
                  json_agg(
                    json_build_object(
                      'name', trim(concat(p.first_name, ' ', p.last_name)),
                      'email', p.public_email,
                      'role', fm.role
                    )
                  ) filter (where p.id is not null), '[]'
                ) as members
           from firms f
           left join firm_members fm on fm.firm_id = f.id and fm.status = 'active'
           left join profiles p on p.id = fm.profile_id
          where f.subscription_status = any($1)
          group by f.id
          order by f.subscription_started_at desc nulls last`,
        [PAYING_STATUSES]
      );
      return json({ count: rows.length, customers: rows });
    }
  );

  // -------------------------------------------------------------------------
  // Write actions
  // -------------------------------------------------------------------------

  server.registerTool(
    'update_profile',
    {
      title: 'Update profile',
      description:
        'Update an allowlisted set of fields on one profile. For anything outside this list, use query_database.',
      inputSchema: z.object({
        profile_id: z.string(),
        headline: z.string().optional(),
        bio: z.string().optional(),
        firm_name: z.string().optional(),
        accepting_work: z.boolean().optional(),
        visibility_state: z.string().optional(),
        is_listed: z.boolean().optional(),
      }),
    },
    async ({ profile_id, ...fields }) => {
      const patch = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(patch).length === 0) return fail('No fields to update');
      const sb = supabaseService();
      const { data, error } = await sb
        .from('profiles')
        .update(patch)
        .eq('id', profile_id)
        .select()
        .maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail('Profile not found');
      return json({ updated: patch, profile: data });
    }
  );

  server.registerTool(
    'update_job',
    {
      title: 'Update job',
      description: 'Update an allowlisted set of fields on one job.',
      inputSchema: z.object({
        job_id: z.string(),
        status: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        deadline_date: z.string().optional().describe('ISO date (YYYY-MM-DD)'),
      }),
    },
    async ({ job_id, ...fields }) => {
      const patch = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(patch).length === 0) return fail('No fields to update');
      const sb = supabaseService();
      const { data, error } = await sb
        .from('jobs')
        .update(patch)
        .eq('id', job_id)
        .select()
        .maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail('Job not found');
      return json({ updated: patch, job: data });
    }
  );

  server.registerTool(
    'send_individual_email',
    {
      title: 'Send individual email',
      description:
        'Send a single transactional email via Resend. One recipient only — bulk sends are not allowed through this tool.',
      inputSchema: z.object({
        to: z.string().email(),
        subject: z.string(),
        html: z.string().optional(),
        text: z.string().optional(),
        reply_to: z.string().email().optional(),
      }),
    },
    async ({ to, subject, html, text, reply_to }) => {
      if (!html && !text) return fail('Provide html or text');
      try {
        const result = await sendEmail({ to, subject, html, text, replyTo: reply_to });
        return json({ sent: true, to, subject, result });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );

  server.registerTool(
    'post_facebook_update',
    {
      title: 'Post Facebook update',
      description:
        'Post a plain-text message to the TaxProExchange Facebook Page feed.',
      inputSchema: z.object({
        message: z.string().min(1),
      }),
    },
    async ({ message }) => {
      const pageId = process.env.FACEBOOK_PAGE_ID;
      const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      if (!pageId || !pageToken) return fail('Facebook Page env vars are not configured');

      const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: pageToken }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return fail(`Facebook post failed: ${JSON.stringify(body)}`);
      return json({ posted: true, post_id: (body as any).id ?? null });
    }
  );

  // -------------------------------------------------------------------------
  // Generic escape hatch
  // -------------------------------------------------------------------------

  server.registerTool(
    'query_database',
    {
      title: 'Query database (raw SQL)',
      description:
        'Run an arbitrary SQL statement against the production Postgres database and return the rows. Full read/write access — use with care. Prefer the structured tools above when one fits.',
      inputSchema: z.object({
        sql: z.string().min(1),
        params: z.array(z.any()).optional().describe('Parameterized values for $1, $2, …'),
      }),
    },
    async ({ sql, params }) => {
      try {
        const { rowCount, rows } = await runSql(sql, params ?? []);
        return json({ rowCount, rows });
      } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
      }
    }
  );
}
