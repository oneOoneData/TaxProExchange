import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentProfile } from '@/lib/db/profile';
import { 
  generateSlackInvite, 
  getSlackMemberRecord, 
  upsertSlackMemberRecord, 
  checkRateLimit, 
  recordJoinAttempt 
} from '@/lib/slack';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if user is verified
    if (profile.visibility_state !== 'verified') {
      return NextResponse.json(
        { error: 'Only verified users can join the Slack community' },
        { status: 403 }
      );
    }

    // Check if user is already a Slack member
    const existingMember = await getSlackMemberRecord(profile.id);
    if (existingMember?.joined_at) {
      return NextResponse.json(
        { 
          message: 'Already a member',
          url: `https://app.slack.com/client/${process.env.SLACK_WORKSPACE_ID}`,
          alreadyMember: true
        },
        { status: 200 }
      );
    }

    // Check rate limiting (3 attempts per day)
    const rateLimit = await checkRateLimit(profile.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. You can try ${3 - rateLimit.attemptsToday} more times today.`,
          attemptsToday: rateLimit.attemptsToday
        },
        { status: 429 }
      );
    }

    // Generate Slack invite
    const userName = `${profile.first_name} ${profile.last_name}`.trim();
    const userEmail = profile.public_email || profile.user_id;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'No email available for Slack invite' },
        { status: 400 }
      );
    }
    
    const inviteResult = await generateSlackInvite(userEmail, userName);

    if (inviteResult.error) {
      // Record failed attempt
      await recordJoinAttempt(profile.id, false);
      
      return NextResponse.json(
        { error: inviteResult.error },
        { status: 500 }
      );
    }

    // Record successful attempt
    await recordJoinAttempt(profile.id, true);

    // Create or update Slack member record
    await upsertSlackMemberRecord(profile.id);

    // Return success with invite URL
    return NextResponse.json({
      message: 'Invite generated successfully',
      url: inviteResult.url,
      success: true
    });

  } catch (error) {
    console.error('Error in Slack join API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check Slack membership status
export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if user is verified
    if (profile.visibility_state !== 'verified') {
      return NextResponse.json({
        canJoin: false,
        reason: 'Only verified users can join the Slack community'
      });
    }

    // Check Slack membership status
    const slackMember = await getSlackMemberRecord(profile.id);
    const isMember = Boolean(slackMember?.joined_at);

    // Check rate limiting
    const rateLimit = await checkRateLimit(profile.id);

    return NextResponse.json({
      canJoin: true,
      isMember,
      joinedAt: slackMember?.joined_at || null,
      rateLimit: {
        allowed: rateLimit.allowed,
        attemptsToday: rateLimit.attemptsToday,
        maxAttempts: 3
      }
    });

  } catch (error) {
    console.error('Error checking Slack status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
