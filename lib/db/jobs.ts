import { supabaseService } from '@/lib/supabaseService';

export interface Job {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'draft';
  created_at: string;
  createdAt: string; // For compatibility
  firm: {
    name: string;
    verified: boolean;
    slug?: string;
  };
  specialization_keys?: string[];
  location_states?: string[];
  software_required?: string[];
  payout_type?: string;
  payout_fixed?: number;
  payout_min?: number;
  payout_max?: number;
  remote_ok?: boolean;
}

export interface Profile {
  id: string;
  specializations?: string[];
  states?: string[];
  software?: string[];
  other_software?: string[];
}

/**
 * Get recent jobs posted by verified firms
 */
export async function getRecentJobs(limit: number = 5): Promise<Job[]> {
  try {
    const supabase = supabaseService();
    
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent jobs:', error);
      return [];
    }

    if (!jobs || jobs.length === 0) {
      return [];
    }

    // Get firm information for each job
    const jobsWithFirms = await Promise.all(
      jobs.map(async (job) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, firm_name, visibility_state, slug')
          .eq('clerk_id', job.created_by)
          .single();

        return {
          ...job,
          createdAt: job.created_at, // Add compatibility field
          firm: {
            name: profile?.firm_name || `${profile?.first_name} ${profile?.last_name}` || 'Unknown Firm',
            verified: profile?.visibility_state === 'verified',
            slug: profile?.slug
          }
        };
      })
    );

    // Filter out jobs from unverified profiles
    return jobsWithFirms.filter(job => job.firm.verified);
  } catch (error) {
    console.error('Error in getRecentJobs:', error);
    return [];
  }
}

/**
 * Get user's own jobs
 */
export async function getUserJobs(userId: string): Promise<Job[]> {
  try {
    const supabase = supabaseService();
    
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user jobs:', error);
      return [];
    }

    if (!jobs || jobs.length === 0) {
      return [];
    }

    // Get firm information for each job
    const jobsWithFirms = await Promise.all(
      jobs.map(async (job) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, firm_name, visibility_state, slug')
          .eq('clerk_id', job.created_by)
          .single();

        return {
          ...job,
          createdAt: job.created_at, // Add compatibility field
          firm: {
            name: profile?.firm_name || `${profile?.first_name} ${profile?.last_name}` || 'Unknown Firm',
            verified: profile?.visibility_state === 'verified',
            slug: profile?.slug
          }
        };
      })
    );

    return jobsWithFirms;
  } catch (error) {
    console.error('Error in getUserJobs:', error);
    return [];
  }
}

/**
 * Get user profile with matching data for job highlighting
 */
export async function getUserProfileForMatching(userId: string): Promise<Profile | null> {
  try {
    const supabase = supabaseService();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, specializations, states, software, other_software')
      .or(`clerk_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .single();

    if (error) {
      console.error('Error fetching user profile for matching:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getUserProfileForMatching:', error);
    return null;
  }
}
