// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';
import { ProfileUpdateSchema } from '@/lib/validations/zodSchemas';
import { parseReferralCookie } from '@/lib/cookies';
import { sendEmail } from '@/lib/email';
import { generateUnsubscribeUrl } from '@/lib/unsubscribe';

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
      
      // Normalize primary_location to ensure it's always a proper object (not a string)
      // This prevents the double-encoding issue that caused data quality problems
      let normalizedPrimaryLocation = fullProfileData.primary_location;
      if (normalizedPrimaryLocation) {
        // If it's already an object, use it as-is
        if (typeof normalizedPrimaryLocation === 'object' && !Array.isArray(normalizedPrimaryLocation)) {
          // Ensure it has the correct structure with lowercase keys
          normalizedPrimaryLocation = {
            city: normalizedPrimaryLocation.city ?? normalizedPrimaryLocation.CITY ?? null,
            state: normalizedPrimaryLocation.state ?? normalizedPrimaryLocation.STATE ?? null,
            country: normalizedPrimaryLocation.country ?? normalizedPrimaryLocation.COUNTRY ?? 'US',
            display_name: normalizedPrimaryLocation.display_name ?? normalizedPrimaryLocation.DISPLAY_NAME ?? null
          };
        } else if (typeof normalizedPrimaryLocation === 'string') {
          // If it's a string, try to parse it (shouldn't happen with proper validation, but be safe)
          try {
            const parsed = JSON.parse(normalizedPrimaryLocation);
            normalizedPrimaryLocation = {
              city: parsed.city ?? parsed.CITY ?? null,
              state: parsed.state ?? parsed.STATE ?? null,
              country: parsed.country ?? parsed.COUNTRY ?? 'US',
              display_name: parsed.display_name ?? parsed.DISPLAY_NAME ?? null
            };
          } catch {
            // If parsing fails, set to null (will use default)
            normalizedPrimaryLocation = null;
          }
        } else {
          normalizedPrimaryLocation = null;
        }
      }
      
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
        primary_location: normalizedPrimaryLocation,
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
      
      // Override with normalized primary_location
      primary_location = normalizedPrimaryLocation;
      
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
    const isNewProfile = !existingProfile;

      if (existingProfile) {
      // Update existing profile
      let updateData: any = {
        clerk_id, // Ensure clerk_id is updated in case profile was found by email
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
        .eq('id', existingProfile.id)
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

    // Send welcome email for new signups
    if (isNewProfile && profile && !profileError) {
      const recipientEmail = profile.public_email || userEmail;
      if (recipientEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com';
        const firstName = profile.first_name || 'there';
        const unsubscribeUrl = generateUnsubscribeUrl(profile.id, 'marketing');

        sendEmail({
          to: recipientEmail,
          subject: `Welcome to TaxProExchange, ${firstName}`,
          from: 'Koen at TaxProExchange <support@taxproexchange.com>',
          replyTo: 'support@taxproexchange.com',
          html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 32px 20px;">

    <p style="margin: 0 0 24px 0; font-size: 15px;">Hi ${firstName},</p>

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      Welcome to TaxProExchange. You're in — your profile is created and pending verification.
    </p>

    <p style="margin: 0 0 24px 0; font-size: 15px;">
      TaxProExchange is a professional network for CPAs, EAs, and tax preparers to find overflow help, refer clients, and connect with colleagues across the country. Once you're verified and listed, other professionals can find and contact you.
    </p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; margin: 0 0 28px 0;">
      <p style="margin: 0 0 12px 0; font-weight: 600; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Three things to do now:</p>
      <ol style="margin: 0; padding-left: 20px; color: #334155;">
        <li style="margin: 10px 0; font-size: 15px;"><strong>Complete your profile</strong> — add a bio, your specializations, and the software you use</li>
        <li style="margin: 10px 0; font-size: 15px;"><strong>Browse the directory</strong> — search for colleagues by credential, state, or specialty</li>
        <li style="margin: 10px 0; font-size: 15px;"><strong>Check the job board</strong> — see what overflow work is available, or post your own</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 0 0 32px 0;">
      <a href="${appUrl}/profile/edit" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Complete my profile →
      </a>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 15px;">
      Once you submit your profile for review, I'll personally take a look and verify it — usually within a day or two. If you have questions, just reply to this email.
    </p>

    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; color: #94a3b8;">
      <p style="margin: 0 0 8px 0;">Koen<br>TaxProExchange</p>
      <p style="margin: 0;">
        You're receiving this because you created an account on TaxProExchange.
        <a href="${appUrl}/settings" style="color: #64748b;">Manage preferences</a> ·
        <a href="${unsubscribeUrl}" style="color: #64748b;">Unsubscribe</a>
      </p>
    </div>

  </body>
</html>`,
          text: `Hi ${firstName},

Welcome to TaxProExchange. You're in — your profile is created and pending verification.

TaxProExchange is a professional network for CPAs, EAs, and tax preparers to find overflow help, refer clients, and connect with colleagues across the country. Once you're verified and listed, other professionals can find and contact you.

Three things to do now:
1. Complete your profile — add a bio, your specializations, and the software you use
2. Browse the directory — search for colleagues by credential, state, or specialty
3. Check the job board — see what overflow work is available, or post your own

Complete my profile: ${appUrl}/profile/edit

Once you submit your profile for review, I'll personally take a look and verify it — usually within a day or two. If you have questions, just reply to this email.

Koen
TaxProExchange

---
Manage preferences: ${appUrl}/settings
Unsubscribe: ${unsubscribeUrl}`,
        }).catch((err) => {
          console.error('Failed to send welcome email:', err);
        });
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
