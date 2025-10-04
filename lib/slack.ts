import { supabaseService } from '@/lib/supabaseService';

// Slack API configuration
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_WORKSPACE_ID = process.env.SLACK_WORKSPACE_ID;

export interface SlackInviteResponse {
  url?: string;
  error?: string;
}

/**
 * Generate a single-use invite link for a verified user to join the private Slack workspace
 * This function handles the Slack API call to create an invite
 */
export async function generateSlackInvite(userEmail: string, userName: string): Promise<SlackInviteResponse> {
  if (!SLACK_BOT_TOKEN || !SLACK_WORKSPACE_ID) {
    console.error('Slack configuration missing: SLACK_BOT_TOKEN or SLACK_WORKSPACE_ID not set');
    return { error: 'Slack configuration not available' };
  }

  try {
    // Method 1: Try to create a user invite via Slack API
    const inviteResponse = await fetch('https://slack.com/api/users.admin.invite', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        real_name: userName,
        team_id: SLACK_WORKSPACE_ID,
        resend: false,
        restricted: false,
        ultra_restricted: false,
      }),
    });

    const inviteData = await inviteResponse.json();
    
    if (inviteData.ok) {
      // User was invited successfully
      return { url: `https://app.slack.com/client/${SLACK_WORKSPACE_ID}` };
    } else {
      console.error('Slack invite failed:', inviteData.error);
      
      // If user already exists, return the workspace URL
      if (inviteData.error === 'already_in_team' || inviteData.error === 'already_invited') {
        return { url: `https://app.slack.com/client/${SLACK_WORKSPACE_ID}` };
      }
      
      return { error: inviteData.error || 'Failed to create invite' };
    }
  } catch (error) {
    console.error('Error generating Slack invite:', error);
    return { error: 'Failed to generate invite link' };
  }
}

/**
 * Check if a user is already a member of the Slack workspace
 */
export async function checkSlackMembership(userEmail: string): Promise<boolean> {
  if (!SLACK_BOT_TOKEN) {
    return false;
  }

  try {
    const response = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      },
    });

    const data = await response.json();
    return data.ok && data.user;
  } catch (error) {
    console.error('Error checking Slack membership:', error);
    return false;
  }
}

/**
 * Get or create a Slack member record in the database
 */
export async function getSlackMemberRecord(profileId: string) {
  const supabase = supabaseService();
  const { data, error } = await supabase
    .from('slack_members')
    .select('*')
    .eq('profile_id', profileId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching slack member record:', error);
    return null;
  }

  return data;
}

/**
 * Create or update a Slack member record
 */
export async function upsertSlackMemberRecord(profileId: string, slackUserId?: string) {
  const supabase = supabaseService();
  const { data, error } = await supabase
    .from('slack_members')
    .upsert({
      profile_id: profileId,
      slack_user_id: slackUserId,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting slack member record:', error);
    return null;
  }

  return data;
}

/**
 * Check rate limiting for Slack join attempts (3 attempts per day)
 */
export async function checkRateLimit(profileId: string): Promise<{ allowed: boolean; attemptsToday: number }> {
  const supabase = supabaseService();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('slack_join_attempts')
    .select('*')
    .eq('profile_id', profileId)
    .gte('attempted_at', today.toISOString());

  if (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: false, attemptsToday: 0 };
  }

  const attemptsToday = data?.length || 0;
  return { allowed: attemptsToday < 3, attemptsToday };
}

/**
 * Record a Slack join attempt
 */
export async function recordJoinAttempt(profileId: string, success: boolean = false) {
  const supabase = supabaseService();
  const { error } = await supabase
    .from('slack_join_attempts')
    .insert({
      profile_id: profileId,
      success,
    });

  if (error) {
    console.error('Error recording join attempt:', error);
  }
}
