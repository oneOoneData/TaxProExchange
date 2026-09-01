/**
 * Authorization Helpers for Firm Workspaces
 */

import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from './flags';

/**
 * Resolve a Clerk user id to a profile id.
 *
 * Profiles are inconsistent about which column holds the Clerk id: the webhook
 * and onboarding paths set `clerk_id`, some API paths set `clerk_user_id`, and
 * most rows only have one of the two (~97% have `clerk_id` only). Matching a
 * single column here silently failed for those users, which broke every firm
 * authz check below. Match on either.
 */
export async function resolveProfileId(clerkUserId: string): Promise<string | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .or(`clerk_id.eq.${clerkUserId},clerk_user_id.eq.${clerkUserId}`)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Get all firm IDs where the user is an active member
 */
export async function getUserFirmIds(clerkUserId: string): Promise<string[]> {
  if (!FEATURE_FIRM_WORKSPACES) return [];

  const profileId = await resolveProfileId(clerkUserId);
  if (!profileId) return [];

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('firm_members')
    .select('firm_id')
    .eq('profile_id', profileId)
    .eq('status', 'active');

  if (error || !data) return [];

  return data.map((fm) => fm.firm_id);
}

/**
 * Check if user can access firm workspace features
 */
export function canUseFirmFeatures(): boolean {
  return FEATURE_FIRM_WORKSPACES === true;
}

/**
 * Check if user is an active member of a specific firm
 */
export async function isActiveFirmMember(
  clerkUserId: string,
  firmId: string
): Promise<boolean> {
  if (!FEATURE_FIRM_WORKSPACES) return false;

  const profileId = await resolveProfileId(clerkUserId);
  if (!profileId) return false;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('firm_members')
    .select('id')
    .eq('firm_id', firmId)
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .maybeSingle();

  return !error && !!data;
}

/**
 * Check if user has admin or manager role in a firm
 */
export async function canManageFirm(
  clerkUserId: string,
  firmId: string
): Promise<boolean> {
  if (!FEATURE_FIRM_WORKSPACES) return false;

  const profileId = await resolveProfileId(clerkUserId);
  if (!profileId) return false;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('firm_members')
    .select('role')
    .eq('firm_id', firmId)
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .in('role', ['admin', 'manager'])
    .maybeSingle();

  return !error && !!data;
}

/**
 * Get user's profile ID from Clerk user ID
 */
export async function getProfileIdFromClerkId(
  clerkUserId: string
): Promise<string | null> {
  return resolveProfileId(clerkUserId);
}
