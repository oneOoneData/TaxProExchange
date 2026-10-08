import { NextRequest, NextResponse } from 'next/server';
import { sendProfileCompletionNotification } from '@/lib/email';
import { supabaseService } from '@/lib/supabaseService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile_id,
      first_name,
      last_name,
      email,
      credential_type,
      headline,
      firm_name
    } = body;

    if (!profile_id || !first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get profile slug and additional data for the admin view link
    const supabase = supabaseService();
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('slug, first_name, last_name, visibility_state, ptin, is_listed, acquisition_source, acquisition_source_detail, utm_source, utm_medium, utm_campaign, landing_src')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to get profile slug:', profileError);

      // Try to get profile by ID as fallback
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from('profiles')
        .select('slug, first_name, last_name, visibility_state, ptin, is_listed, acquisition_source, acquisition_source_detail, utm_source, utm_medium, utm_campaign, landing_src')
        .eq('id', profile_id)
        .single();
      
      if (fallbackError || !fallbackProfile) {
        console.error('Profile not found by ID either:', fallbackError);
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      
      console.log('📧 Using fallback profile data:', fallbackProfile);
      profile = fallbackProfile;
    }

    // Log profile details for debugging
    console.log('📧 Profile completion notification - Profile details:', {
      profile_id,
      slug: profile.slug,
      first_name: profile.first_name,
      last_name: profile.last_name,
      visibility_state: profile.visibility_state,
      ptin: profile.ptin,
      is_listed: profile.is_listed
    });

    // Create admin view link using the public profile route with admin parameter
    const adminViewLink = `${process.env.NEXT_PUBLIC_APP_URL}/p/${profile.slug}?admin=true`;
    
    // Create direct approval/rejection links
    const approveLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/email-approve?profileId=${profile_id}&action=approve`;
    const rejectLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/email-approve?profileId=${profile_id}&action=reject`;
    
    console.log('📧 Generated admin links:', { adminViewLink, approveLink, rejectLink });

    // Send notification email to admin
    try {
      await sendProfileCompletionNotification({
        profileId: profile_id,
        firstName: first_name,
        lastName: last_name,
        email: email,
        credentialType: credential_type || 'Not specified',
        ptin: profile.ptin,
        headline: headline || '',
        firmName: firm_name || '',
        isListed: profile.is_listed,
        visibilityState: profile.visibility_state,
        acquisitionSource: profile.acquisition_source || null,
        acquisitionSourceDetail: profile.acquisition_source_detail || null,
        utmSource: profile.utm_source || null,
        utmMedium: profile.utm_medium || null,
        utmCampaign: profile.utm_campaign || null,
        landingSrc: profile.landing_src || null,
        adminViewLink: adminViewLink,
        approveLink: approveLink,
        rejectLink: rejectLink
      });
      
      console.log(`Profile completion notification sent to admin for profile ${profile_id}`);
    } catch (emailError) {
      console.error('Failed to send profile completion notification:', emailError);
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification sent successfully' 
    });

  } catch (error) {
    console.error('Profile completion notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
