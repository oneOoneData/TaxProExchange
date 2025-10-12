import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getProfileIdFromClerkId, isActiveFirmMember } from '@/lib/authz';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import { sendBenchInvitationEmail } from '@/lib/email';

const InviteSchema = z.object({
  firm_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  message: z.string().optional(),
  custom_title_offer: z.string().optional(),
  categories_suggested: z.array(z.string()).optional(),
});

/**
 * POST /api/firm-team/invite
 * Send invitation to a professional to join firm's bench
 */
export async function POST(request: NextRequest) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = InviteSchema.parse(body);

    // Check membership (must be admin or manager)
    const inviterProfileId = await getProfileIdFromClerkId(userId);
    if (!inviterProfileId) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isMember = await isActiveFirmMember(userId, validatedData.firm_id);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const supabase = createServerClient();

    // Check if professional is already in the bench
    const { data: existingBench } = await supabase
      .from('firm_trusted_bench')
      .select('id')
      .eq('firm_id', validatedData.firm_id)
      .eq('trusted_profile_id', validatedData.profile_id)
      .single();

    if (existingBench) {
      return NextResponse.json(
        { error: 'Professional is already on your team' },
        { status: 409 }
      );
    }

    // Check if there's already a pending invitation
    const { data: pendingInvite } = await supabase
      .from('bench_invitations')
      .select('id')
      .eq('firm_id', validatedData.firm_id)
      .eq('profile_id', validatedData.profile_id)
      .eq('status', 'pending')
      .single();

    if (pendingInvite) {
      return NextResponse.json(
        { error: 'Invitation already pending' },
        { status: 409 }
      );
    }

    // Get firm and inviter details for notification
    const { data: firm } = await supabase
      .from('firms')
      .select('name, slug')
      .eq('id', validatedData.firm_id)
      .single();

    const { data: inviter } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', inviterProfileId)
      .single();

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('bench_invitations')
      .insert({
        firm_id: validatedData.firm_id,
        profile_id: validatedData.profile_id,
        invited_by_profile_id: inviterProfileId,
        message: validatedData.message || null,
        custom_title_offer: validatedData.custom_title_offer || null,
        categories_suggested: validatedData.categories_suggested || [],
        status: 'pending',
      })
      .select(`
        id,
        firm_id,
        profile_id,
        message,
        custom_title_offer,
        status,
        created_at,
        firms!inner (
          id,
          name,
          slug
        ),
        profiles!bench_invitations_profile_id_fkey (
          id,
          first_name,
          last_name,
          public_email
        )
      `)
      .single();

    if (inviteError || !invitation) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Send email notification to professional
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taxproexchange.com';
    const professional = invitation.profiles as any;
    const firmData = invitation.firms as any;
    
    try {
      await sendBenchInvitationEmail({
        professionalFirstName: professional.first_name,
        professionalEmail: professional.public_email,
        firmName: firmData.name,
        inviterName: inviter ? `${inviter.first_name} ${inviter.last_name}` : 'A team member',
        customTitleOffer: validatedData.custom_title_offer,
        message: validatedData.message,
        acceptLink: `${appUrl}/invitations?id=${invitation.id}&action=accept`,
        declineLink: `${appUrl}/invitations?id=${invitation.id}&action=decline`,
        viewInvitationLink: `${appUrl}/invitations`,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails - invitation is still created
    }

    return NextResponse.json({
      success: true,
      invitation,
    });
  } catch (error: any) {
    console.error('Error in POST /api/firm-team/invite:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/firm-team/invite
 * List invitations (sent or received)
 */
export async function GET(request: NextRequest) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const firmId = searchParams.get('firm_id');
    const view = searchParams.get('view') || 'received'; // 'sent' or 'received'

    const profileId = await getProfileIdFromClerkId(userId);
    if (!profileId) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const supabase = createServerClient();
    let query = supabase
      .from('bench_invitations')
      .select(`
        id,
        firm_id,
        profile_id,
        message,
        custom_title_offer,
        categories_suggested,
        status,
        created_at,
        expires_at,
        firms!inner (
          id,
          name,
          slug,
          website
        ),
        profiles!bench_invitations_profile_id_fkey (
          id,
          first_name,
          last_name,
          slug,
          credential_type,
          image_url,
          avatar_url
        ),
        inviter:invited_by_profile_id (
          id,
          first_name,
          last_name
        )
      `);

    if (view === 'sent' && firmId) {
      // Invitations sent by this firm
      const isMember = await isActiveFirmMember(userId, firmId);
      if (!isMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      query = query.eq('firm_id', firmId);
    } else {
      // Invitations received by this professional
      query = query.eq('profile_id', profileId);
    }

    const { data, error } = await query
      .in('status', ['pending', 'accepted', 'declined'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invitations: data || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/firm-team/invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

