// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';
import { ProfileUpdateSchema } from '@/lib/validations/zodSchemas';
import { parseReferralCookie } from '@/lib/cookies';

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
  
  // Get profile by clerk_id
  
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
      
      console.log('🔍 Returning 404 - profile not found');
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('🔍 Profile found:', profile);
    console.log('🔍 Profile ID:', profile.id);

    // Fetch related data
    const [specializationsResult, locationsResult, softwareResult, licensesResult] = await Promise.all([
      supabase
        .from('profile_specializations')
        .select('specialization_slug')
        .eq('profile_id', profile.id),
      supabase
        .from('profile_locations')
        .select('state, city')
        .eq('profile_id', profile.id),
      supabase
        .from('profile_software')
        .select('software_slug')
        .eq('profile_id', profile.id),
      supabase
        .from('licenses')
        .select('id, license_kind, license_number, issuing_authority, state, expires_on, board_profile_url, status')
        .eq('profile_id', profile.id)
    ]);

    console.log('🔍 Related data results:', {
      specializations: specializationsResult,
      locations: locationsResult,
      software: softwareResult,
      licenses: licensesResult
    });

    // Process licenses - include license_number since this is the user's own profile
    const processedLicenses = licensesResult.data || [];

    // Debug logging
    console.log('Profile data being returned:', {
      profile: profile,
      specializations: specializationsResult.data?.map(s => s.specialization_slug) || [],
      locations: locationsResult.data?.map(l => ({ state: l.state, city: l.city })) || [],
      software: softwareResult.data?.map(s => s.software_slug) || [],
      other_software: profile.other_software || [],
      licenses: processedLicenses
    });

    // Return profile with actual relationship data (never include license_number)
    return NextResponse.json({
      ...profile,
      specializations: specializationsResult.data?.map(s => s.specialization_slug) || [],
      locations: locationsResult.data?.map(l => ({ state: l.state, city: l.city })) || [],
      software: softwareResult.data?.map(s => s.software_slug) || [],
      other_software: profile.other_software || [],
      licenses: processedLicenses
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
    
    // Process profile update request
    
    // Check what type of update this is
    const requestKeys = Object.keys(body);
    const isCredentialUpdate = requestKeys.length <= 3 && 
                              requestKeys.includes('clerk_id') &&
                              requestKeys.includes('credential_type') &&
                              requestKeys.includes('licenses');
    
    const isEmailPreferencesUpdate = requestKeys.length <= 3 && 
                                    requestKeys.includes('clerk_id') &&
                                    (requestKeys.includes('connection_email_notifications') || 
                                     requestKeys.includes('email_preferences'));
    
    let validationResult;
    if (isCredentialUpdate) {
      // Use credential-specific validation
      const { CredentialUpdateSchema } = await import('@/lib/validations/zodSchemas');
      validationResult = CredentialUpdateSchema.safeParse(body);
    } else if (isEmailPreferencesUpdate) {
      // Use email preferences validation
      const { EmailPreferencesUpdateSchema } = await import('@/lib/validations/zodSchemas');
      validationResult = EmailPreferencesUpdateSchema.safeParse(body);
    } else {
      // Use full profile validation
      validationResult = ProfileUpdateSchema.safeParse(body);
    }
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.flatten() 
      }, { status: 400 });
    }
    
    const validatedData = validationResult.data;
    
    // Handle different update types
    let specializations, locations, software, other_software, public_contact, 
        works_multistate, works_international, countries, email_preferences, 
        primary_location, location_radius, credential_type, licenses, 
        years_experience, entity_revenue_range, firm_size, annual_returns_range,
        connection_email_notifications, profileData;
    
    if (isCredentialUpdate) {
      // For credential-only updates
      const credentialData = validatedData as any;
      credential_type = credentialData.credential_type;
      licenses = credentialData.licenses;
      // Set defaults for other fields
      specializations = [];
      locations = [];
      software = [];
      other_software = [];
      public_contact = false;
      works_multistate = false;
      works_international = false;
      countries = [];
      email_preferences = undefined;
      primary_location = undefined;
      location_radius = 50;
      years_experience = undefined;
      entity_revenue_range = undefined;
      firm_size = undefined;
      annual_returns_range = undefined;
      profileData = {};
    } else if (isEmailPreferencesUpdate) {
      // For email preferences updates
      const emailData = validatedData as any;
      connection_email_notifications = emailData.connection_email_notifications;
      email_preferences = emailData.email_preferences;
      // Set other fields to undefined so they don't get updated
      specializations = undefined;
      locations = undefined;
      software = undefined;
      other_software = undefined;
      public_contact = undefined;
      works_multistate = undefined;
      works_international = undefined;
      countries = undefined;
      primary_location = undefined;
      location_radius = undefined;
      credential_type = undefined;
      licenses = undefined;
      years_experience = undefined;
      entity_revenue_range = undefined;
      firm_size = undefined;
      annual_returns_range = undefined;
      profileData = {};
    } else {
      // For full profile updates
      const fullProfileData = validatedData as any;
      ({
        specializations,
        locations,
        software,
        other_software,
        public_contact,
        works_multistate,
        works_international,
        countries,
        email_preferences,
        primary_location,
        location_radius,
        credential_type,
        licenses,
        years_experience,
        entity_revenue_range,
        firm_size,
        annual_returns_range,
        connection_email_notifications,
        ...profileData 
      } = fullProfileData);
      
      console.log('🔍 Experience and firm fields being saved:', { 
        years_experience, 
        entity_revenue_range,
        firm_size,
        annual_returns_range 
      });
    }
    
    // Extract clerk_id from the original body since it's not in the validated schema
    const { clerk_id } = body;

    // Debug logging
    console.log('Received profile data:', {
      clerk_id,
      specializations,
      locations,
      software,
      other_software,
      email_preferences,
      years_experience,
      entity_revenue_range,
      firm_size,
      annual_returns_range,
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
      let updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (isCredentialUpdate) {
        // For credential-only updates, only update credential fields
        updateData = {
          ...updateData,
          credential_type,
        };
      } else {
        // For full profile updates, update all fields
        updateData = {
          ...updateData,
          ...profileData,
          public_contact: public_contact ?? false,
          works_multistate: works_multistate ?? false,
          works_international: works_international ?? false,
          countries: countries || [],
          other_software: other_software || [],
          email_preferences: email_preferences || null,
          primary_location: primary_location || null,
          location_radius: location_radius || 50,
          years_experience: years_experience || null,
          entity_revenue_range: entity_revenue_range || null,
          firm_size: firm_size ?? null,
          annual_returns_range: annual_returns_range ?? null,
          connection_email_notifications: connection_email_notifications ?? true,
          onboarding_complete: true,
          credential_type,
        };
      }
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('clerk_id', clerk_id)
        .select()
        .single();
      
      profile = updatedProfile;
      profileError = updateError;
    } else {
      // Handle referral tracking for new profiles
      let referrerProfileId = null;
      const cookieHeader = request.headers.get('cookie');
      const refSlug = parseReferralCookie(cookieHeader);
      
      if (refSlug) {
        // Look up the referrer's profile ID by slug
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', refSlug)
          .single();
        
        if (referrerProfile) {
          referrerProfileId = referrerProfile.id;
          console.log('🎯 Referral tracking:', { refSlug, referrerProfileId });
        }
      }

      // Auto-accept legal terms for new profiles
      const { LEGAL_VERSIONS } = await import('@/lib/legal');
      const now = new Date().toISOString();

      // Insert new profile
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          clerk_id,
          ...profileData,
          credential_type: credential_type || 'Student', // Ensure credential_type is always set
          slug: generateSlug(profileData.first_name, profileData.last_name, clerk_id),
          public_contact: public_contact ?? false,
          works_multistate: works_multistate ?? false,
          works_international: works_international ?? false,
          countries: countries || [],
          other_software: other_software || [],
          email_preferences: email_preferences || {
            job_notifications: true,
            application_updates: true,
            connection_requests: true,
            verification_emails: true,
            message_notifications: true,
            marketing_updates: true,
            frequency: 'immediate'
          },
          primary_location: primary_location || null,
          location_radius: location_radius || 50,
          years_experience: years_experience || null,
          entity_revenue_range: entity_revenue_range || null,
          firm_size: firm_size ?? null,
          annual_returns_range: annual_returns_range ?? null,
          connection_email_notifications: connection_email_notifications ?? true,
          onboarding_complete: true,
          referrer_profile_id: referrerProfileId,
          // Auto-accept legal terms
          tos_version: LEGAL_VERSIONS.TOS,
          tos_accepted_at: now,
          privacy_version: LEGAL_VERSIONS.PRIVACY,
          privacy_accepted_at: now,
          updated_at: now,
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
      
      // Save locations
      if (locations && locations.length > 0) {
        // Delete existing locations
        await supabase
          .from('profile_locations')
          .delete()
          .eq('profile_id', profileId);
        
        // Insert new locations
        const locationData = locations.map((location: { state: string; city?: string }) => ({
          profile_id: profileId,
          state: location.state,
          city: location.city || null
        }));
        
        await supabase
          .from('profile_locations')
          .insert(locationData);
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
      
      // Handle licenses with privacy protection
      if (credential_type && credential_type !== "Student" && credential_type !== "Other" && licenses && licenses.length > 0) {
        console.log('🔍 SAVING LICENSES:', {
          profileId,
          credential_type,
          licenses: licenses.length
        });
        
        // Delete existing licenses
        const { error: deleteError } = await supabase
          .from('licenses')
          .delete()
          .eq('profile_id', profileId);
        
        if (deleteError) {
          console.log('❌ Delete licenses error:', deleteError);
        } else {
          console.log('✅ Existing licenses deleted successfully');
        }
        
        // Insert new licenses (license_number is private, never returned)
        const licenseData = licenses.map((license: any) => ({
          profile_id: profileId,
          license_kind: license.license_kind,
          license_number: license.license_number, // Private field
          issuing_authority: license.issuing_authority,
          state: license.state || null,
          expires_on: license.expires_on || null,
          board_profile_url: license.board_profile_url || null,
          status: 'pending'
        }));
        
        console.log('🔍 Inserting license data (without license numbers):', 
          licenseData.map((l: any) => ({ ...l, license_number: '[PRIVATE]' })));
        
        const { error: insertError } = await supabase
          .from('licenses')
          .insert(licenseData);
        
        if (insertError) {
          console.log('❌ Insert licenses error:', insertError);
        } else {
          console.log('✅ Licenses saved successfully');
        }
      } else if (credential_type === "Student" || credential_type === "Other" || credential_type === "Accountant" || credential_type === "Financial Planner") {
        // Students, "Other", "Accountant", and "Financial Planner" don't require tax licenses - remove any existing ones
        console.log('🔍 Removing licenses for non-tax-credential profile type:', credential_type);
        await supabase
          .from('licenses')
          .delete()
          .eq('profile_id', profileId);
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

    // Send notification email to admin when profile is completed
    if (profile && profile.onboarding_complete) {
      try {
        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify/profile-completed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.public_email || userEmail || 'No email available',
            credential_type: profile.credential_type,
            headline: profile.headline,
            firm_name: profile.firm_name
          }),
        });
        
        if (!notificationResponse.ok) {
          console.error('Notification API returned error:', notificationResponse.status, notificationResponse.statusText);
        } else {
          console.log('Profile completion notification sent to admin');
        }
      } catch (emailError) {
        console.error('Failed to send profile completion notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Sync to HubSpot if email preferences were updated
    if (isEmailPreferencesUpdate && profile) {
      // Fire-and-forget: don't block the response
      const emailPrefs = profile.email_preferences as any;
      const marketingOptIn = emailPrefs?.marketing_updates ?? false;
      
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hubspot/sync-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.public_email || userEmail,
          first_name: profile.first_name,
          last_name: profile.last_name,
          marketing_opt_in: marketingOptIn,
        }),
      }).catch(error => {
        console.error('HubSpot sync failed (non-blocking):', error);
      });
    }

    // Profile saved successfully
    
    // Return updated profile
    
    // Create a completely clean response object to avoid any circular references
    const cleanProfile = {
      id: String(profile?.id || ''),
      first_name: String(profile?.first_name || ''),
      last_name: String(profile?.last_name || ''),
      headline: String(profile?.headline || ''),
      bio: String(profile?.bio || ''),
      credential_type: String(profile?.credential_type || ''),
      ptin: String(profile?.ptin || ''),
      website_url: String(profile?.website_url || ''),
      linkedin_url: String(profile?.linkedin_url || ''),
      firm_name: String(profile?.firm_name || ''),
      phone: String(profile?.phone || ''),
      public_email: String(profile?.public_email || ''),
      avatar_url: String(profile?.avatar_url || ''),
      is_listed: Boolean(profile?.is_listed),
      visibility_state: String(profile?.visibility_state || ''),
      accepting_work: Boolean(profile?.accepting_work),
      slug: String(profile?.slug || ''),
      public_contact: Boolean(profile?.public_contact),
      works_multistate: Boolean(profile?.works_multistate),
      works_international: Boolean(profile?.works_international),
      countries: Array.isArray(profile?.countries) ? profile.countries : [],
      other_software: Array.isArray(profile?.other_software) ? profile.other_software : [],
      email_preferences: profile?.email_preferences || null,
      primary_location: profile?.primary_location || null,
      location_radius: Number(profile?.location_radius) || 50,
      years_experience: String(profile?.years_experience || ''),
      entity_revenue_range: String(profile?.entity_revenue_range || ''),
      firm_size: profile?.firm_size || null,
      annual_returns_range: profile?.annual_returns_range || null,
      onboarding_complete: Boolean(profile?.onboarding_complete),
      created_at: String(profile?.created_at || ''),
      updated_at: String(profile?.updated_at || '')
    };
    
    return NextResponse.json({ 
      ok: true, 
      profile: profile 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error: ' + errorMessage }, { status: 500 });
  }
}

export async function POST(_request: Request) {
  return NextResponse.json({ ok: true });
}
