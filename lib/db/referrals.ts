import { supabaseService } from '@/lib/supabaseService';

export interface Referral {
  id: string;
  referrer_id: string;
  recipient_id: string;
  client_name: string;
  client_info?: string;
  fee_amount: number;
  platform_cut_percent: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  message?: string;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  referrer?: { first_name: string; last_name: string; slug: string };
  recipient?: { first_name: string; last_name: string; slug: string };
}

/**
 * Create a referral
 */
  if (params.referrer_id === params.recipient_id) {
    return { error: "Cannot send a referral to yourself" };
  }

export async function createReferral(params: {
  referrer_id: string;
  recipient_id: string;
  client_name: string;
  client_info?: string;
  fee_amount: number;
  message?: string;
}): Promise<{ data?: Referral; error?: string }> {
  const supabase = supabaseService();

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: params.referrer_id,
      recipient_id: params.recipient_id,
      client_name: params.client_name,
      client_info: params.client_info,
      fee_amount: params.fee_amount,
      message: params.message,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

/**
 * Get referrals for a user (both sent and received)
 */
export async function getUserReferrals(profileId: string): Promise<Referral[]> {
  const supabase = supabaseService();

  const { data: sent } = await supabase
    .from('referrals')
    .select('*, recipient:recipient_id(first_name, last_name, slug)')
    .eq('referrer_id', profileId)
    .order('created_at', { ascending: false });

  const { data: received } = await supabase
    .from('referrals')
    .select('*, referrer:referrer_id(first_name, last_name, slug)')
    .eq('recipient_id', profileId)
    .order('created_at', { ascending: false });

  // Deduplicate by ID (self-referrals appear in both queries)
  const seen = new Set<string>();
  return [...(sent || []), ...(received || [])].filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

/**
 * Accept a referral — the recipient agrees to pay the fee
 */
export async function acceptReferral(referralId: string): Promise<{ data?: Referral; error?: string }> {
  const supabase = supabaseService();

  const { data, error } = await supabase
    .from('referrals')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', referralId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

/**
 * Decline a referral
 */
export async function declineReferral(referralId: string): Promise<{ error?: string }> {
  const supabase = supabaseService();

  const { error } = await supabase
    .from('referrals')
    .update({ status: 'declined' })
    .eq('id', referralId)
    .eq('status', 'pending');

  if (error) return { error: error.message };
  return {};
}

/**
 * Mark a referral as completed (work is done)
 */
export async function completeReferral(referralId: string): Promise<{ error?: string }> {
  const supabase = supabaseService();

  const { error } = await supabase
    .from('referrals')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', referralId)
    .eq('status', 'accepted');

  if (error) return { error: error.message };
  return {};
}

/**
 * Get or create a Stripe Connect account link for a user
 */
export async function getStripeConnectOnboardingLink(profileId: string): Promise<{ url?: string; error?: string }> {
  // This will be wired up when Koen sets up Stripe Connect
  const supabase = supabaseService();

  const { data: existing } = await supabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded')
    .eq('profile_id', profileId)
    .single();

  if (existing?.onboarded) {
    return { url: '/referrals/payout-settings' }; // already set up
  }

  // TODO: Call Stripe API to create Connect account and return onboarding link
  return { error: 'Stripe Connect not yet configured. Contact support.' };
}
