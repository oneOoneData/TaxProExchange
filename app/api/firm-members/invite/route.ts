/**
 * Firm Member Invitation API
 * POST /api/firm-members/invite - Send invitation to join firm as team member
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json(
      { error: 'Feature not available' },
      { status: 404 }
    );
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firmId, email, role, message } = body;

    // Validate inputs
    if (!firmId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firmId, email' },
        { status: 400 }
      );
    }

    if (!['manager', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be manager or member' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get requesting user's profile
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('clerk_user_id', userId)
      .single();

    if (inviterError || !inviterProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or manager of this firm
    const { data: membership } = await supabase
      .from('firm_members')
      .select('role')
      .eq('firm_id', firmId)
      .eq('profile_id', inviterProfile.id)
      .eq('status', 'active')
      .single();

    if (!membership || !['admin', 'manager'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins and managers can invite team members' },
        { status: 403 }
      );
    }

    // Get firm details
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id, name')
      .eq('id', firmId)
      .single();

    if (firmError || !firm) {
      return NextResponse.json(
        { error: 'Firm not found' },
        { status: 404 }
      );
    }

    // Check if email already has an invitation pending
    const { data: existingInvite } = await supabase
      .from('firm_member_invitations')
      .select('id, status')
      .eq('firm_id', firmId)
      .eq('invited_email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('public_email', email.toLowerCase())
      .single();

    // Check if they're already a member
    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from('firm_members')
        .select('id')
        .eq('firm_id', firmId)
        .eq('profile_id', existingProfile.id)
        .eq('status', 'active')
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'This user is already a member of the firm' },
          { status: 400 }
        );
      }
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('firm_member_invitations')
      .insert({
        firm_id: firmId,
        invited_email: email.toLowerCase(),
        invited_profile_id: existingProfile?.id || null,
        role: role,
        invited_by_profile_id: inviterProfile.id,
        message: message || null,
        token: token,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL || 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/firm-invite/${token}`;
    
    const emailSubject = `${inviterProfile.first_name} ${inviterProfile.last_name} invited you to join ${firm.name} on TaxProExchange`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">You're invited to join ${firm.name}</h2>
        
        <p>Hi there,</p>
        
        <p><strong>${inviterProfile.first_name} ${inviterProfile.last_name}</strong> has invited you to join <strong>${firm.name}</strong> as a team ${role} on TaxProExchange.</p>
        
        ${message ? `<div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0;"><p style="margin: 0; color: #475569;"><em>"${message}"</em></p></div>` : ''}
        
        <p>As a team ${role}, you'll be able to help manage the firm's bench of trusted tax professionals.</p>
        
        <div style="margin: 30px 0;">
          <a href="${acceptUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">This invitation expires in 7 days.</p>
        
        <p style="color: #64748b; font-size: 14px;">If you don't have a TaxProExchange account yet, you'll be prompted to create one.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        
        <p style="color: #64748b; font-size: 12px;">
          If you're not interested, you can safely ignore this email. The invitation will expire automatically.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.invited_email,
        role: invitation.role,
        expires_at: invitation.expires_at,
      },
    });

  } catch (error: any) {
    console.error('Error in POST /api/firm-members/invite:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

