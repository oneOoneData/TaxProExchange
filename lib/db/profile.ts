import { supabaseService } from '@/lib/supabaseService';
import { auth } from '@clerk/nextjs/server';

export interface Profile {
  id: string;
  clerk_id?: string;
  clerk_user_id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  headline?: string;
  bio?: string;
  credential_type: string;
  ptin?: string;
  website_url?: string;
  linkedin_url?: string;
  firm_name?: string;
  phone?: string;
  public_email?: string;
  avatar_url?: string;
  is_listed: boolean;
  visibility_state: 'hidden' | 'pending_verification' | 'verified' | 'rejected';
  accepting_work: boolean;
  slug?: string;
  onboarding_complete: boolean;
  profile_type?: 'tax_professional' | 'firm_admin';
  created_at: string;
  updated_at: string;
}

export interface VerificationRequest {
  id: string;
  profile_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
}

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log('🔍 getCurrentProfile: No userId from auth');
      return null;
    }

    console.log('🔍 getCurrentProfile: Looking for profile with userId:', userId);

    const supabase = supabaseService();
    
    // Try to find profile by clerk_id first (most users have this), then clerk_user_id
    // Note: user_id is a UUID field, not a Clerk ID, so we don't include it in the OR clause
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`clerk_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .single();

    if (error) {
      console.error('🔍 getCurrentProfile: Error fetching profile:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('🔍 getCurrentProfile: Found profile:', {
      id: profile?.id,
      first_name: profile?.first_name,
      onboarding_complete: profile?.onboarding_complete,
      clerk_id: profile?.clerk_id,
      clerk_user_id: profile?.clerk_user_id
    });

    return profile;
  } catch (error) {
    console.error('🔍 getCurrentProfile: Error in getCurrentProfile:', error);
    return null;
  }
}

/**
 * Get verification request for a profile
 * NOTE: This table doesn't exist - verification is tracked via profile.visibility_state
 * Kept for backward compatibility with components
 */
export async function getVerificationRequest(profileId: string): Promise<VerificationRequest | null> {
  // Table doesn't exist - verification is tracked via profile.visibility_state
  return null;
}

/**
 * Get public profile URL
 */
export function getPublicProfileUrl(slug?: string): string {
  if (!slug) {
    return '/profile/edit'; // Fallback to profile edit if no slug
  }
  return `/p/${slug}`;
}

/**
 * Check if user has completed onboarding
 */
export function isOnboardingComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  
  // Use the onboarding_complete field from the database
  return profile.onboarding_complete === true;
}

/**
 * Get profile display name
 */
export function getProfileDisplayName(profile: Profile | null): string {
  if (!profile) return 'User';
  
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  
  return profile.first_name || 'User';
}

/**
 * Get credential badge color
 */
export function getCredentialBadgeColor(credentialType: string): string {
  switch (credentialType) {
    case 'CPA':
      return 'bg-blue-100 text-blue-800';
    case 'EA':
      return 'bg-slate-100 text-slate-800';
    case 'CTEC':
      return 'bg-indigo-100 text-indigo-800';
    case 'Tax Lawyer (JD)':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get visibility state badge color
 */
export function getVisibilityBadgeColor(visibilityState: string): string {
  switch (visibilityState) {
    case 'verified':
      return 'bg-blue-100 text-blue-800';
    case 'pending_verification':
      return 'bg-amber-100 text-amber-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'hidden':
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Check if profile is a firm member (firm_admin type)
 */
export function isFirmMember(profile: Profile | null): boolean {
  return profile?.profile_type === 'firm_admin';
}

/**
 * Get firm member badge color (premium gold with shine effect)
 */
export function getFirmMemberBadgeColor(): string {
  return 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-amber-900 border border-yellow-600 shadow-md font-semibold';
}
