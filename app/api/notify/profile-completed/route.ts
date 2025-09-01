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

    // Get profile slug for the admin view link
    const supabase = supabaseService();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('slug')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to get profile slug:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Create admin view link using the public profile route with admin parameter
    const adminViewLink = `${process.env.NEXT_PUBLIC_APP_URL}/p/${profile.slug}?admin=true`;

    // Send notification email to admin
    try {
      await sendProfileCompletionNotification({
        profileId: profile_id,
        firstName: first_name,
        lastName: last_name,
        email: email,
        credentialType: credential_type || 'Not specified',
        headline: headline || '',
        firmName: firm_name || '',
        adminViewLink: adminViewLink
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
