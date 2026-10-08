import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import { supabaseService } from '@/lib/supabaseService';
import { absoluteUrl } from '@/lib/url';
import { checkRateLimit, logQuery } from '@/lib/publicMcp/rateLimit';
import type { AuthenticatedFirm } from '@/lib/publicMcp/auth';

// ---------------------------------------------------------------------------
// This is a SEPARATE, read-only, PII-safe surface from the internal/admin
// MCP server (lib/mcp/tools.ts). No SQL passthrough, no writes, no bulk
// list, no email/phone -- see dev-public-mcp-server-2026-10 for the full
// set of hard boundaries this file must respect.
//
// Auth note: app/api/public-mcp/route.ts's withMcpAuth verifies the bearer
// key ONCE per request and puts the resolved firm in AuthInfo.extra.
// mcp-handler's initializeServer (where registerPublicMcpTools runs) is
// called fresh per request but is NOT given that authInfo -- only each
// tool call's own `ctx` is. So every tool handler below reads
// ctx.authInfo.extra itself rather than closing over a firm captured at
// registration time.
// ---------------------------------------------------------------------------

type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

type ToolCtx = {
  authInfo?: {
    extra?: Record<string, unknown>;
  };
};

function json(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string): ToolResult {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

function getAuthenticatedFirm(ctx: ToolCtx): AuthenticatedFirm | null {
  const extra = ctx?.authInfo?.extra;
  if (!extra || typeof extra.firmId !== 'string' || typeof extra.apiKeyId !== 'string') return null;
  return {
    firmId: extra.firmId,
    apiKeyId: extra.apiKeyId,
    firmName: typeof extra.firmName === 'string' ? extra.firmName : '',
  };
}

const HARD_RESULT_CAP = 10;
// How many candidates to pull before shuffling + slicing to the cap. This
// (plus the shuffle) is what keeps the ordering non-walkable -- a caller
// can't page through by incrementing some stable sort key, because there
// isn't one exposed, and which rows land in the top 10 varies per call.
const CANDIDATE_POOL_SIZE = 50;

// Only ever exposed fields -- never email, phone, or anything not already
// on the public profile page.
const PUBLIC_PROFILE_COLUMNS =
  'id, slug, first_name, last_name, credential_type, headline, specializations, software, states, works_multistate, works_international, years_experience, accepting_work';

function toPublicProfile(row: any) {
  return {
    display_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    credential_type: row.credential_type,
    headline: row.headline || null,
    specializations: row.specializations || [],
    software: row.software || [],
    states: row.states || [],
    works_multistate: !!row.works_multistate,
    works_international: !!row.works_international,
    years_experience: row.years_experience || null,
    accepting_work: !!row.accepting_work,
    verified: true, // every result is already filtered to visibility_state='verified'
    profile_url: absoluteUrl(`/p/${row.slug}`),
  };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Discoverable, searchable base query: every public-MCP read goes through
 * this filter set. Honors opted-out/unlisted/unverified profiles the same
 * way the rest of the app does -- reusing the existing allow_matching
 * opt-out rather than adding a new toggle (per the spec's own
 * recommendation), plus is_listed/visibility_state/is_deleted.
 */
function baseDiscoverableQuery(sb: ReturnType<typeof supabaseService>) {
  return sb
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('visibility_state', 'verified')
    .eq('is_listed', true)
    .eq('is_deleted', false)
    .neq('allow_matching', false); // true or null (not explicitly opted out)
}

/** Every tool call goes through this so no tool can skip the rate-limit/log/auth check. */
async function withAuthRateLimitAndLog(
  ctx: ToolCtx,
  tool: string,
  params: Record<string, unknown>,
  fn: (firm: AuthenticatedFirm) => Promise<{ result: ToolResult; resultCount: number | null }>
): Promise<ToolResult> {
  const firm = getAuthenticatedFirm(ctx);
  if (!firm) return fail('Unauthorized');

  const rl = await checkRateLimit(firm.apiKeyId);
  if (!rl.allowed) {
    await logQuery({ firmId: firm.firmId, apiKeyId: firm.apiKeyId, tool, params, resultCount: null });
    return fail(rl.reason || 'Rate limit exceeded');
  }
  const { result, resultCount } = await fn(firm);
  await logQuery({ firmId: firm.firmId, apiKeyId: firm.apiKeyId, tool, params, resultCount });
  return result;
}

export function registerPublicMcpTools(server: McpServer) {
  server.registerTool(
    'search_professionals',
    {
      title: 'Search verified tax professionals',
      description:
        'Search the TaxProExchange verified directory. Returns at most 10 ranked matches with a profile link each -- never a full list, never contact details. Refine filters if more than 10 match.',
      inputSchema: z.object({
        specialty: z.string().optional().describe('e.g. "S-Corp", "Crypto tax", "IRS Representation"'),
        software: z.string().optional().describe('e.g. "ProConnect", "TaxDome", "Drake"'),
        state: z.string().optional().describe('Two-letter state code the pro serves'),
        credential: z.string().optional().describe('e.g. CPA, EA, CTEC, Other'),
        accepting_work: z.boolean().optional(),
        keywords: z.string().optional().describe('Free-text match against headline'),
        limit: z.number().int().min(1).max(HARD_RESULT_CAP).optional(),
      }),
    },
    async (params: any, ctx: any) =>
      withAuthRateLimitAndLog(ctx, 'search_professionals', params, async () => {
        const { specialty, software, state, credential, accepting_work, keywords, limit } = params;
        const effectiveLimit = Math.min(limit ?? HARD_RESULT_CAP, HARD_RESULT_CAP);
        const sb = supabaseService();

        const applyFilters = (q: any) => {
          if (specialty) q = q.contains('specializations', [specialty]);
          if (software) q = q.contains('software', [software]);
          if (state) q = q.contains('states', [state]);
          if (credential) q = q.eq('credential_type', credential);
          if (typeof accepting_work === 'boolean') q = q.eq('accepting_work', accepting_work);
          if (keywords) q = q.ilike('headline', `%${keywords}%`);
          return q;
        };

        // Candidate pool, capped well above the result cap, in no
        // caller-controllable stable order -- then shuffled and sliced.
        const { data: candidates, error: candidatesError } = await applyFilters(
          baseDiscoverableQuery(sb)
        ).limit(CANDIDATE_POOL_SIZE);
        if (candidatesError) return { result: fail(candidatesError.message), resultCount: null };

        // Separate count-only query so "N match; refine your filters" is
        // accurate even when N > CANDIDATE_POOL_SIZE.
        const { count: totalCount } = await applyFilters(
          sb
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('visibility_state', 'verified')
            .eq('is_listed', true)
            .eq('is_deleted', false)
            .neq('allow_matching', false)
        );

        const picked = shuffle(candidates || []).slice(0, effectiveLimit);
        const results = picked.map(toPublicProfile);

        return {
          result: json({
            count_returned: results.length,
            total_matching: totalCount ?? results.length,
            note:
              (totalCount ?? 0) > results.length
                ? `${totalCount} professionals match; showing top ${results.length}. Refine your filters for a better match.`
                : undefined,
            professionals: results,
          }),
          resultCount: results.length,
        };
      })
  );

  server.registerTool(
    'get_professional',
    {
      title: 'Get a verified tax professional by profile slug',
      description:
        'Fetch public details for one professional the caller already has a link to (from search_professionals). No email/phone.',
      inputSchema: z.object({
        slug: z.string().describe('The slug from a profile_url returned by search_professionals'),
      }),
    },
    async (params: any, ctx: any) =>
      withAuthRateLimitAndLog(ctx, 'get_professional', params, async () => {
        const { slug } = params;
        const sb = supabaseService();
        const { data, error } = await baseDiscoverableQuery(sb).eq('slug', slug).maybeSingle();
        if (error) return { result: fail(error.message), resultCount: null };
        if (!data) {
          // Don't distinguish "doesn't exist" from "exists but unlisted/opted
          // out" -- both read as not found to this surface.
          return { result: fail('Professional not found'), resultCount: 0 };
        }
        return { result: json(toPublicProfile(data)), resultCount: 1 };
      })
  );

  server.registerTool(
    'list_filter_options',
    {
      title: 'List valid filter values',
      description:
        'Static reference data: the valid specialty/software/state/credential values search_professionals accepts, so the assistant can filter correctly.',
      inputSchema: z.object({}),
    },
    async () => {
      // Static reference data -- safe, no DB read, not logged/rate-limited
      // (matches the spec calling this one a lightweight helper). Still
      // requires a valid key to reach this far (withMcpAuth gates the
      // whole route), just doesn't count against the query cap.
      return json({
        credentials: ['CPA', 'EA', 'CTEC', 'OR_Tax_Preparer', 'OR_Tax_Consultant', 'Tax Lawyer (JD)', 'Accountant', 'Financial Planner', 'Bookkeeper', 'PTIN Only', 'Other'],
        note: "specialty, software, and state accept free-text values matched against each professional's listed specializations/software/states.",
      });
    }
  );
}
