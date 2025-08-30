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

// Generate a unique slug that checks for conflicts
async function generateUniqueSlug(userId: string, supabase: any): Promise<string> {
  // Start with a base slug
  const baseSlug = 'new-user';
  const shortId = userId.substring(0, 8);
  let slug = `${baseSlug}-${shortId}`;
  
  // Check if slug exists and append counter if needed
  let counter = 1;
  let finalSlug = slug;
  
  while (true) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', finalSlug)
      .single();
    
    if (!existingProfile) {
      break; // Slug is unique
    }
    
    // Slug exists, try with counter
    finalSlug = `${slug}-${counter}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 100) {
      // Fallback to timestamp-based slug
      const timestamp = Date.now().toString(36);
      finalSlug = `${baseSlug}-${timestamp}`;
      break;
    }
  }
  
  return finalSlug;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = supabaseService();
    
    // First, try to get the user's email from Clerk
    let userEmail: string | null = null;
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.primary_email_address_id && userData.email_addresses) {
          const primaryEmail = userData.email_addresses.find((e: any) => e.id === userData.primary_email_address_id);
          if (primaryEmail) {
            userEmail = primaryEmail.email_address;
          }
        } else if (userData.email_addresses && userData.email_addresses.length > 0) {
          userEmail = userData.email_addresses[0].email_address;
        }
      }
    } catch (error) {
      console.log('🔍 Could not fetch email from Clerk, will use clerk_id lookup:', error);
    }
    
    console.log('🔍 User email from Clerk:', userEmail);
    
    // Check if profile already exists by email first, then by clerk_id
    let existingProfile = null;
    
    if (userEmail) {
      console.log('🔍 Searching for profile by email:', userEmail);
      const { data: emailProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('public_email', userEmail)
        .single();
      
      if (emailProfile) {
        console.log('🔍 Profile found by email:', emailProfile.id);
        existingProfile = emailProfile;
      }
    }
    
    // If no profile found by email, try by clerk_id
    if (!existingProfile) {
      console.log('🔍 Searching for profile by clerk_id:', userId);
      const { data: clerkProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      existingProfile = clerkProfile;
    }

    if (existingProfile) {
      return new Response('Profile already exists', { status: 400 });
    }

    // Create new profile with legal acceptance
    const now = new Date().toISOString();
    
    // Generate a unique slug
    const slug = await generateUniqueSlug(userId, supabase);
    
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
