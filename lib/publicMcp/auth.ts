import crypto from 'crypto';
import { supabaseService } from '@/lib/supabaseService';

const PAYING_STATUSES = ['active', 'trialing'];
const KEY_PREFIX_LEN = 8;

/**
 * Generate a new plaintext API key for a firm. The caller is responsible
 * for showing it to the user exactly once -- only the hash is persisted.
 */
export function generateApiKey(): { plaintext: string; hash: string; prefix: string } {
  const plaintext = `tpe_live_${crypto.randomBytes(24).toString('hex')}`;
  const hash = hashApiKey(plaintext);
  const prefix = plaintext.slice(0, KEY_PREFIX_LEN);
  return { plaintext, hash, prefix };
}

export function hashApiKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

export type AuthenticatedFirm = {
  firmId: string;
  apiKeyId: string;
  firmName: string;
};

/**
 * Validate a bearer token against firm_api_keys, live on every call --
 * never cached -- so a lapsed/canceled subscription or a revoked key stops
 * working immediately, not on some refresh interval.
 */
export async function authenticatePublicMcpRequest(
  bearerToken: string | undefined
): Promise<AuthenticatedFirm | null> {
  if (!bearerToken) return null;

  const hash = hashApiKey(bearerToken);
  const supabase = supabaseService();

  const { data: keyRow, error } = await supabase
    .from('firm_api_keys')
    .select('id, firm_id, revoked_at, firms(name, subscription_status)')
    .eq('key_hash', hash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !keyRow) return null;

  const firm = Array.isArray((keyRow as any).firms)
    ? (keyRow as any).firms[0]
    : (keyRow as any).firms;

  if (!firm || !PAYING_STATUSES.includes(firm.subscription_status)) {
    // Subscription lapsed/canceled -- deny immediately, don't just rely on
    // the key being revoked (revocation on cancellation is best-effort
    // elsewhere; this check is the real enforcement point).
    return null;
  }

  // Best-effort last-used stamp; never block the request on this write.
  supabase
    .from('firm_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(
      () => {},
      () => {}
    );

  return { firmId: keyRow.firm_id, apiKeyId: keyRow.id, firmName: firm.name };
}
