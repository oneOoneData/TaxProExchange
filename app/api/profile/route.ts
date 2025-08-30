// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

// Generate a clean, URL-friendly slug from name and ID
function generateSlug(firstName: string | null, lastName: string | null, userId: string): string {
  // Create base slug from name
  let baseSlug = '';
  if (firstName && lastName) {
    baseSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;
  } else if (firstName) {
    baseSlug = firstName.toLowerCase();
  } else if (lastName) {
    baseSlug = lastName.toLowerCase();
  } else {
    baseSlug = 'user';
  }
  
  // Clean the slug: remove special chars, replace spaces with hyphens
  baseSlug = baseSlug
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
  
  // Add a short unique identifier to prevent conflicts
  const shortId = userId.substring(0, 8);
  
  return `${baseSlug}-${shortId}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clerkId = searchParams.get('clerk_id') ?? null;
  
  console.log('🔍 Profile API called with clerk_id:', clerkId);
  
  if (!clerkId) {
    return NextResponse.json({ error: 'clerk_id is required' }, { status: 400 });
  }

  try {
    const supabase = supabaseService();
    console.log('🔍 Supabase client created successfully');
    
    // First, try to get the user's email from Clerk
    let userEmail: string | null = null;
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
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
    
    // Try to find profile by email first (more reliable across environments)
    let profile = null;
    let profileError = null;
    
    if (userEmail) {
      console.log('🔍 Searching for profile by email:', userEmail);
      const { data: emailProfile, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('public_email', userEmail)
        .single();
      
      if (emailProfile) {
        console.log('🔍 Profile found by email:', emailProfile.id);
        profile = emailProfile;
      } else if (emailError && emailError.code !== 'PGRST116') {
        console.error('🔍 Error searching by email:', emailError);
      }
    }
    
    // If no profile found by email, try by clerk_id
    if (!profile) {
      console.log('🔍 Searching for profile by clerk_id:', clerkId);
      const { data: clerkProfile, error: clerkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();
      
      profile = clerkProfile;
      profileError = clerkError;
    }

    console.log('🔍 Profile query result:', { profile, profileError });

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!profile) {
      console.log('🔍 No profile found for clerk_id:', clerkId, 'or email:', userEmail);
      
      // Let's check what profiles exist to debug this
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, clerk_id, first_name, last_name, slug, public_email')
        .limit(10);
      
      if (allProfilesError) {
        console.error('🔍 Error fetching all profiles:', allProfilesError);
      } else {
        console.log('🔍 Sample of existing profiles:', allProfiles);
      }
      
      console.log('🔍 Returning empty object');
      return NextResponse.json({});
    }

    console.log('🔍 Profile found:', profile);
    console.log('🔍 Profile ID:', profile.id);

    // Fetch related data
    const [specializationsResult, statesResult, softwareResult] = await Promise.all([
      supabase
        .from('profile_specializations')
        .select('specialization_slug')
        .eq('profile_id', profile.id),
      supabase
        .from('profile_locations')
        .select('state')
        .eq('profile_id', profile.id),
      supabase
        .from('profile_software')
        .select('software_slug')
        .eq('profile_id', profile.id)
    ]);

    console.log('🔍 Related data results:', {
      specializations: specializationsResult,
      states: statesResult,
      software: softwareResult
    });

    // Debug logging
    console.log('Profile data being returned:', {
      profile: profile,
      specializations: specializationsResult.data?.map(s => s.specialization_slug) || [],
      states: statesResult.data?.map(s => s.state) || [],
      software: softwareResult.data?.map(s => s.software_slug) || [],
      other_software: profile.other_software || []
    });

    // Return profile with actual relationship data
    return NextResponse.json({
      ...profile,
      specializations: specializationsResult.data?.map(s => s.specialization_slug) || [],
      states: statesResult.data?.map(s => s.state) || [],
      software: softwareResult.data?.map(s => s.software_slug) || [],
      other_software: profile.other_software || []
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      clerk_id, 
      specializations, 
      states, 
      software, 
      other_software,
      public_contact,
      works_multistate,
      works_international,
      countries,
      ...profileData 
    } = body;

    // Debug logging
    console.log('Received profile data:', {
      clerk_id,
      specializations,
      states,
      software,
      other_software,
      profileData
    });

    if (clerk_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = supabaseService();
    
    // First, try to get the user's email from Clerk
    let userEmail: string | null = null;
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${clerk_id}`, {
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
    
    // Try to find profile by email first (more reliable across environments)
    let existingProfile = null;
    
    if (userEmail) {
      console.log('🔍 Searching for profile by email:', userEmail);
      const { data: emailProfile, error: emailError } = await supabase
        .from('profiles')
        .select('id')
        .eq('public_email', userEmail)
        .single();
      
      if (emailProfile) {
        console.log('🔍 Profile found by email:', emailProfile.id);
        existingProfile = emailProfile;
      } else if (emailError && emailError.code !== 'PGRST116') {
        console.error('🔍 Error searching by email:', emailError);
      }
    }
    
    // If no profile found by email, try by clerk_id
    if (!existingProfile) {
      console.log('🔍 Searching for profile by clerk_id:', clerk_id);
      const { data: clerkProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', clerk_id);

      if (checkError) {
        console.error('Profile check error:', checkError);
        return NextResponse.json({ error: 'Database error: ' + checkError.message }, { status: 500 });
      }

      // If there are multiple profiles (shouldn't happen after constraint fix), use the first one
      existingProfile = clerkProfiles?.[0];
    }

    let profile;
    let profileError;

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          public_contact: public_contact ?? false,
          works_multistate: works_multistate ?? false,
          works_international: works_international ?? false,
          countries: countries || [],
          other_software: other_software || [],
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', clerk_id)
        .select()
        .single();
      
      profile = updatedProfile;
      profileError = updateError;
    } else {
      // Insert new profile
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          clerk_id,
          ...profileData,
          slug: generateSlug(profileData.first_name, profileData.last_name, clerk_id),
          public_contact: public_contact ?? false,
          works_multistate: works_multistate ?? false,
          works_international: works_international ?? false,
          countries: countries || [],
          other_software: other_software || [],
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      profile = newProfile;
      profileError = insertError;
    }

    // If profile was saved successfully, save the relationships
    if (profile && !profileError) {
      const profileId = profile.id;
      
      // Save specializations
      if (specializations && specializations.length > 0) {
        console.log('🔍 SAVING SPECIALIZATIONS:', {
          profileId,
          specializations,
          count: specializations.length
        });
        
        // Delete existing specializations
        const { error: deleteError } = await supabase
          .from('profile_specializations')
          .delete()
          .eq('profile_id', profileId);
        
        if (deleteError) {
          console.log('❌ Delete specializations error:', deleteError);
        } else {
          console.log('✅ Existing specializations deleted successfully');
        }
        
        // Insert new specializations
        const specializationData = specializations.map((slug: string) => ({
          profile_id: profileId,
          specialization_slug: slug
        }));
        
        console.log('🔍 Inserting specialization data:', specializationData);
        
        const { error: insertError } = await supabase
          .from('profile_specializations')
          .insert(specializationData);
        
        if (insertError) {
          console.log('❌ Insert specializations error:', insertError);
        } else {
          console.log('✅ Specializations saved successfully');
        }
      } else {
        console.log('🔍 No specializations to save:', { specializations });
      }
      
      // Save states (locations)
      if (states && states.length > 0) {
        // Delete existing locations
        await supabase
          .from('profile_locations')
          .delete()
          .eq('profile_id', profileId);
        
        // Insert new states
        const stateData = states.map((state: string) => ({
          profile_id: profileId,
          state: state
        }));
        
        await supabase
          .from('profile_locations')
          .insert(stateData);
      }
      
      // Save software
      if (software && software.length > 0) {
        // Delete existing software
        await supabase
          .from('profile_software')
          .delete()
          .eq('profile_id', profileId);
        
        // Insert new software
        const softwareData = software.map((slug: string) => ({
          profile_id: profileId,
          software_slug: slug
        }));
        
        await supabase
          .from('profile_software')
          .insert(softwareData);
      }
    }

    if (profileError) {
      console.error('Profile save error:', profileError);
      
      // Provide more specific error messages
      let errorMessage = 'Database error';
      if (profileError.code === '23505') {
        errorMessage = 'Profile already exists with this information';
      } else if (profileError.code === '23503') {
        errorMessage = 'Invalid reference data';
      } else if (profileError.message) {
        errorMessage = profileError.message;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    console.log('Profile saved successfully:', profile);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error('Profile update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error: ' + errorMessage }, { status: 500 });
  }
}

export async function POST(_request: Request) {
  return NextResponse.json({ ok: true });
}
