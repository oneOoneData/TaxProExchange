import { supabaseService } from '@/lib/supabaseService';

export interface Connection {
  id: string;
  requester_profile_id: string;
  recipient_profile_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  requester_profile?: {
    first_name: string;
    last_name: string;
    credential_type: string;
    slug?: string;
  };
  recipient_profile?: {
    first_name: string;
    last_name: string;
    credential_type: string;
    slug?: string;
  };
}

export interface RecentlyVerifiedProfile {
  id: string;
  first_name: string;
  last_name: string;
  credential_type: string;
  slug?: string;
  firm_name?: string;
  updated_at: string;
}

/**
 * Get recent connections for a profile
 */
export async function getRecentConnections(profileId: string, limit: number = 5): Promise<Connection[]> {
  try {
    const supabase = supabaseService();
    
    const { data: connections, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester_profile:profiles!connections_requester_profile_id_fkey(
          first_name,
          last_name,
          credential_type,
          slug
        ),
        recipient_profile:profiles!connections_recipient_profile_id_fkey(
          first_name,
          last_name,
          credential_type,
          slug
        )
      `)
      .or(`requester_profile_id.eq.${profileId},recipient_profile_id.eq.${profileId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching connections:', error);
      return [];
    }

    return connections || [];
  } catch (error) {
    console.error('Error in getRecentConnections:', error);
    return [];
  }
}

/**
 * Get recently verified profiles for social proof
 */
export async function getRecentlyVerified(limit: number = 5): Promise<RecentlyVerifiedProfile[]> {
  try {
    const supabase = supabaseService();
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, credential_type, slug, firm_name, updated_at')
      .eq('visibility_state', 'verified')
      .eq('is_listed', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recently verified profiles:', error);
      return [];
    }

    return profiles || [];
  } catch (error) {
    console.error('Error in getRecentlyVerified:', error);
    return [];
  }
}

/**
 * Get connection display name
 */
export function getConnectionDisplayName(connection: Connection, currentProfileId: string): string {
  const isRequester = connection.requester_profile_id === currentProfileId;
  const profile = isRequester ? connection.recipient_profile : connection.requester_profile;
  
  if (!profile) return 'Unknown User';
  
  return `${profile.first_name} ${profile.last_name}`;
}

/**
 * Get connection status text
 */
export function getConnectionStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Connected';
    case 'declined':
      return 'Declined';
    default:
      return 'Unknown';
  }
}

/**
 * Get connection status color
 */
export function getConnectionStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600';
    case 'accepted':
      return 'text-green-600';
    case 'declined':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
}
