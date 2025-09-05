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

// Generate a unique slug that checks for conflicts with retry logic
async function generateUniqueSlug(userId: string, supabase: any): Promise<string> {
  const baseSlug = 'new-user';
  const shortId = userId.substring(0, 8);
  const baseSlugWithId = `${baseSlug}-${shortId}`;
  
  // Add timestamp and random component to make it more unique
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  let finalSlug = `${baseSlugWithId}-${timestamp}-${random}`;
  
  // Check if slug exists and try alternatives if needed
  let counter = 1;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', finalSlug)
      .single();
    
    if (!existingProfile) {
      return finalSlug; // Slug is unique
    }
    
    // Slug exists, try with counter
    finalSlug = `${baseSlugWithId}-${timestamp}-${random}-${counter}`;
    counter++;
    attempts++;
  }
  
  // Final fallback - use UUID if all else fails
  const uuid = crypto.randomUUID().substring(0, 8);
  return `${baseSlug}-${uuid}`;
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

    // Create new profile with legal acceptance and retry logic
    const now = new Date().toISOString();
    
    let profileCreated = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!profileCreated && attempts < maxAttempts) {
      attempts++;
      
      // Generate a unique slug for this attempt
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
          years_experience: null,
          entity_revenue_range: null,
          slug: slug,
          tos_version: LEGAL_VERSIONS.TOS,
          tos_accepted_at: now,
          privacy_version: LEGAL_VERSIONS.PRIVACY,
          privacy_accepted_at: now
        });

      if (error) {
        console.error(`Profile creation attempt ${attempts} error:`, error);
        
        // If it's a duplicate key error and we have attempts left, retry
        if (error.code === '23505' && attempts < maxAttempts) {
          console.log(`Retrying profile creation (attempt ${attempts + 1}/${maxAttempts})`);
          // Add a small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
          continue;
        }
        
        return new Response('Failed to create profile', { status: 500 });
      }
      
      profileCreated = true;
    }
    
    if (!profileCreated) {
      return new Response('Failed to create profile after multiple attempts', { status: 500 });
    }

    return new Response('Profile created successfully', { status: 201 });
  } catch (error) {
    console.error('Create profile error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
