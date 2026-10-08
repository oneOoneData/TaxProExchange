import { supabaseService } from '@/lib/supabaseService';

// Per-key caps, per the spec: 60/day and ~10/min to start. DB-backed via
// mcp_public_query_log rather than Redis/Upstash -- there's no existing
// rate-limit infra in this repo and MVP volume doesn't need one.
const PER_MINUTE_LIMIT = 10;
const PER_DAY_LIMIT = 60;

export type RateLimitResult = {
  allowed: boolean;
  reason?: string;
};

export async function checkRateLimit(apiKeyId: string): Promise<RateLimitResult> {
  const supabase = supabaseService();
  const now = Date.now();

  const oneMinuteAgo = new Date(now - 60 * 1000).toISOString();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: minuteCount }, { count: dayCount }] = await Promise.all([
    supabase
      .from('mcp_public_query_log')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('created_at', oneMinuteAgo),
    supabase
      .from('mcp_public_query_log')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('created_at', oneDayAgo),
  ]).then((results) => results.map((r) => ({ count: r.count ?? 0 })));

  if (minuteCount >= PER_MINUTE_LIMIT) {
    return { allowed: false, reason: `Rate limit exceeded: max ${PER_MINUTE_LIMIT} requests/minute` };
  }
  if (dayCount >= PER_DAY_LIMIT) {
    return { allowed: false, reason: `Rate limit exceeded: max ${PER_DAY_LIMIT} requests/day` };
  }
  return { allowed: true };
}

/**
 * Log a query. Always call this after a tool call completes (success or
 * not) -- it's the audit trail, the rate-limit counter, and the usage
 * instrumentation source all at once. Never let a logging failure surface
 * to the caller.
 */
export async function logQuery(args: {
  firmId: string;
  apiKeyId: string;
  tool: string;
  params: Record<string, unknown>;
  resultCount: number | null;
}) {
  try {
    const supabase = supabaseService();
    await supabase.from('mcp_public_query_log').insert({
      firm_id: args.firmId,
      api_key_id: args.apiKeyId,
      tool: args.tool,
      params: args.params,
      result_count: args.resultCount,
    });
  } catch (error) {
    console.error('Non-fatal: failed to log public MCP query:', error);
  }
}
