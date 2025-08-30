import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LEGAL_VERSIONS } from '@/lib/legal';

function supabaseService() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = supabaseService();
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (existingProfile) {
      return new Response('Profile already exists', { status: 400 });
    }

    // Create new profile with legal acceptance
    const now = new Date().toISOString();
    
    // Generate a unique slug
    const baseSlug = 'new-user';
    const shortId = userId.substring(0, 8);
    const slug = `${baseSlug}-${shortId}`;
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        clerk_id: userId,
        first_name: 'Unknown',
        last_name: 'User',
        headline: 'New Tax Professional',
        bio: 'Profile created automatically',
        credential_type: 'Other',
        firm_name: '',
        public_email: '',
        phone: '',
        website_url: '',
        linkedin_url: '',
        accepting_work: true,
        public_contact: false,
        works_multistate: false,
        works_international: false,
        countries: [],
        specializations: [],
        states: [],
        software: [],
        other_software: [],
        slug: slug,
        tos_version: LEGAL_VERSIONS.TOS,
        tos_accepted_at: now,
        privacy_version: LEGAL_VERSIONS.PRIVACY,
        privacy_accepted_at: now
      });

    if (error) {
      console.error('Profile creation error:', error);
      return new Response('Failed to create profile', { status: 500 });
    }

    return new Response('Profile created successfully', { status: 201 });
  } catch (error) {
    console.error('Create profile error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
