import { supabaseService } from '@/lib/supabaseService';
import { auth } from '@clerk/nextjs/server';

export interface Profile {
  id: string;
  clerk_id?: string;
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
      return null;
    }

    const supabase = supabaseService();
    
    // Try to find profile by clerk_user_id first, then clerk_id, then user_id
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`clerk_user_id.eq.${userId},clerk_id.eq.${userId},user_id.eq.${userId}`)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getCurrentProfile:', error);
    return null;
  }
}

/**
 * Get verification request for a profile
 */
export async function getVerificationRequest(profileId: string): Promise<VerificationRequest | null> {
  try {
    const supabase = supabaseService();
    
    const { data: verification, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Table might not exist or no verification request found
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching verification request:', error);
      return null;
    }

    return verification;
  } catch (error) {
    console.error('Error in getVerificationRequest:', error);
    return null;
  }
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
      return 'bg-green-100 text-green-800';
    case 'CTEC':
      return 'bg-purple-100 text-purple-800';
    case 'Tax Lawyer (JD)':
      return 'bg-yellow-100 text-yellow-800';
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
      return 'bg-green-100 text-green-800';
    case 'pending_verification':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'hidden':
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
