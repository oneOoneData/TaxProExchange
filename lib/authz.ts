/**
 * Authorization Helpers for Firm Workspaces
 */

import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from './flags';

/**
 * Get all firm IDs where the user is an active member
 */
export async function getUserFirmIds(clerkUserId: string): Promise<string[]> {
  if (!FEATURE_FIRM_WORKSPACES) return [];

  const supabase = createServerClient();
  
  // First, get the profile ID for this clerk user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (!profile) return [];

  // Then get all firms where this profile is an active member
  const { data, error } = await supabase
    .from('firm_members')
    .select('firm_id')
    .eq('profile_id', profile.id)
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

  const supabase = createServerClient();
  
  // Get profile ID for this clerk user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (!profile) return false;

  // Check membership
  const { data, error } = await supabase
    .from('firm_members')
    .select('id')
    .eq('firm_id', firmId)
    .eq('profile_id', profile.id)
    .eq('status', 'active')
    .single();

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

  const supabase = createServerClient();
  
  // Get profile ID for this clerk user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (!profile) return false;

  // Check membership with admin/manager role
  const { data, error } = await supabase
    .from('firm_members')
    .select('role')
    .eq('firm_id', firmId)
    .eq('profile_id', profile.id)
    .eq('status', 'active')
    .in('role', ['admin', 'manager'])
    .single();

  return !error && !!data;
}

/**
 * Get user's profile ID from Clerk user ID
 */
export async function getProfileIdFromClerkId(
  clerkUserId: string
): Promise<string | null> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) return null;
  
  return data.id;
}

