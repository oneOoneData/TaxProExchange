import { supabaseService } from '@/lib/supabaseService';
import { Profile } from '@/lib/db/profile';

// Dashboard-specific queries for the upgraded dashboard
export interface DashboardData {
  profile: Profile | null;
  opportunities: any[];
  messageThreads: any[];
  userJobs: any[];
  analytics: {
    profileViews: number;
    directoryImpressions: number;
    connectionRequests: number;
    acceptedConnections: number;
  };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    // Get profile data
    const supabase = supabaseService();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get opportunities (similar profiles in same state/specialties)
    const opportunities = await getOpportunities(profile?.id);

    // Get recent message threads
    const messageThreads = await getRecentMessageThreads(profile?.id);

    // Get user's jobs
    const userJobs = await getUserJobs(profile?.id);

    // Get analytics data (placeholder for now)
    const analytics = {
      profileViews: 0,
      directoryImpressions: 0,
      connectionRequests: 0,
      acceptedConnections: 0
    };

    return {
      profile,
      opportunities,
      messageThreads,
      userJobs,
      analytics
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      profile: null,
      opportunities: [],
      messageThreads: [],
      userJobs: [],
      analytics: {
        profileViews: 0,
        directoryImpressions: 0,
        connectionRequests: 0,
        acceptedConnections: 0
      }
    };
  }
}

async function getOpportunities(profileId?: string) {
  if (!profileId) return [];

  try {
    // TODO: Implement real opportunity suggestions based on:
    // - Same state/location
    // - Complementary credentials
    // - Similar specialties
    // - Not already connected
    
    // For now, return empty array - will be populated with mock data in component
    return [];
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return [];
  }
}

async function getRecentMessageThreads(profileId?: string) {
  if (!profileId) return [];

  try {
    // TODO: Implement real message threads query
    // This would query the messages table for recent conversations
    
    // For now, return empty array - will be populated with mock data in component
    return [];
  } catch (error) {
    console.error('Error fetching message threads:', error);
    return [];
  }
}

async function getUserJobs(profileId?: string) {
  if (!profileId) return [];

  try {
    // TODO: Implement real jobs query
    // This would query the jobs table for jobs created by this user
    
    // For now, return empty array - will be populated with mock data in component
    return [];
  } catch (error) {
    console.error('Error fetching user jobs:', error);
    return [];
  }
}

// Helper function to get profile completion percentage
export function getProfileCompletionPercentage(profile: Profile | null): number {
  if (!profile) return 0;

  let completed = 0;
  let total = 8;

  // Basic info
  if (profile.first_name && profile.last_name && profile.credential_type) completed++;
  
  // Contact info
  if (profile.phone || profile.public_email) completed++;
  
  // Bio
  if (profile.bio && profile.bio.length > 10) completed++;
  
  // Avatar
  if (profile.avatar_url) completed++;
  
  // Headline
  if (profile.headline && profile.headline.length > 10) completed++;
  
  // Verification
  if (profile.visibility_state === 'verified') completed++;
  
  // TODO: Add specialties and locations checks when data is available
  // For now, assume incomplete
  total -= 2;

  return Math.round((completed / total) * 100);
}
