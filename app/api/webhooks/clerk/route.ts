import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";
import { supabaseService } from "@/lib/supabaseService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generate a clean, URL-friendly slug from name and ID with retry logic
async function generateUniqueSlug(firstName: string | null, lastName: string | null, userId: string, supabase: any): Promise<string> {
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

export async function POST(request: Request) {
  console.log('🔍 Clerk webhook called');
  
  try {
    const payload = await request.text();
    console.log('🔍 Webhook payload received, length:', payload.length);
    console.log('Payload preview:', payload.substring(0, 200));
    
    const secret = process.env.CLERK_WEBHOOK_SECRET!;
    
    console.log('🔍 CLERK_WEBHOOK_SECRET exists:', !!secret);
    console.log('🔍 CLERK_WEBHOOK_SECRET length:', secret ? secret.length : 0);
    console.log('🔍 CLERK_WEBHOOK_SECRET starts with:', secret ? secret.substring(0, 10) + '...' : 'NOT SET');
    
    if (!secret) {
      console.error('CLERK_WEBHOOK_SECRET is not set');
      return NextResponse.json({ ok: false, error: "Webhook secret not configured" }, { status: 500 });
    }

    const wh = new Webhook(secret);
    const headersList = await headers();

    let evt: any;
    try {
      evt = wh.verify(payload, {
        "svix-id": headersList.get("svix-id")!,
        "svix-timestamp": headersList.get("svix-timestamp")!,
        "svix-signature": headersList.get("svix-signature")!,
      } as WebhookRequiredHeaders);
    } catch (error) {
      console.error('🔍 Webhook signature verification failed:', error);
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    console.log('🔍 Webhook event received:', evt.type, evt.data.id);
    console.log('🔍 Event data:', JSON.stringify(evt.data, null, 2));

    if (evt.type === "user.created" || evt.type === "user.updated" || evt.type === "user.deleted") {
      const u = evt.data;
      console.log('🔍 Processing user event:', evt.type, 'for user:', u.id);
      
      const supabase = supabaseService();
      console.log('🔍 Supabase client created for webhook');

      // Handle user deletion
      if (evt.type === "user.deleted") {
        console.log('🔍 Deleting profile for deleted user:', u.id);
        
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('clerk_id', u.id);
          
        if (deleteError) {
          console.error('🔍 Error deleting profile for user:', u.id, deleteError);
          return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
        }
        
        console.log('🔍 Profile deleted successfully for user:', u.id);
        return NextResponse.json({ ok: true, message: "Profile deleted successfully" });
      }
      
      // Extract email from the correct path in the data structure
      let email = null;
      
      // Try multiple ways to get the email
      if (u.primary_email_address_id && u.email_addresses) {
        const primaryEmail = u.email_addresses.find((e: any) => e.id === u.primary_email_address_id);
        email = primaryEmail?.email_address;
        console.log('🔍 Found email via primary_email_address_id:', email);
      }
      
      if (!email && u.email_addresses && u.email_addresses.length > 0) {
        email = u.email_addresses[0].email_address;
        console.log('🔍 Found email via first email_addresses entry:', email);
      }
      
      // Fallback: try to get from user object directly
      if (!email && u.email_addresses) {
        email = u.email_addresses[0]?.email_address;
        console.log('🔍 Found email via fallback method:', email);
      }

      console.log('🔍 Final email for user:', email);
      console.log('🔍 User data structure:', JSON.stringify(u, null, 2));

      // If no email, use a placeholder or skip the insert
      if (!email) {
        console.log('🔍 No email found for user, skipping profile creation');
        return NextResponse.json({ ok: true, message: "User created but no email available" });
      }

      const profileData = {
        clerk_id: u.id,
        email,
        first_name: u.first_name ?? 'New User',
        last_name: u.last_name ?? '',
        headline: `${u.first_name || 'New'} ${u.last_name || 'User'}`,
        credential_type: 'Other', // Set default value - ensure this is never null
        firm_name: null,
        public_email: email,
        phone: null,
        website_url: null,
        linkedin_url: null,
        accepting_work: false,
        // visibility_state will use database default ('hidden')
        is_listed: false,
        slug: await generateUniqueSlug(u.first_name, u.last_name, u.id, supabase),
        image_url: u.image_url ?? null,
      };

      // Validate that credential_type is not null before upsert
      if (!profileData.credential_type) {
        console.error('🔍 credential_type is null, setting to default');
        profileData.credential_type = 'Other';
      }
      
      // Double-check that credential_type is valid
      const validCredentialTypes = ['CPA', 'EA', 'CTEC', 'Student', 'Tax Lawyer (JD)', 'PTIN Only', 'Other'];
      if (!validCredentialTypes.includes(profileData.credential_type)) {
        console.error('🔍 Invalid credential_type, setting to default:', profileData.credential_type);
        profileData.credential_type = 'Other';
      }
      
      console.log('🔍 Attempting to upsert profile with data:', profileData);

      // Retry logic for profile creation
      let profileCreated = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!profileCreated && attempts < maxAttempts) {
        attempts++;
        
        // Generate a new slug for this attempt
        profileData.slug = await generateUniqueSlug(u.first_name, u.last_name, u.id, supabase);
        
        const { error } = await supabase
          .from("profiles")
          .upsert(profileData, { onConflict: "clerk_id" });
          
        if (error) {
          console.error(`🔍 Supabase upsert attempt ${attempts} error:`, error);
          
          // Check for credential_type constraint violation
          if (error.message && error.message.includes('credential_type') && error.message.includes('not-null constraint')) {
            console.error('🔍 CREDENTIAL_TYPE CONSTRAINT VIOLATION:', {
              error: error.message,
              profileData: profileData,
              credential_type: profileData.credential_type,
              isNull: profileData.credential_type === null,
              isUndefined: profileData.credential_type === undefined
            });
          }
          
          // If it's a duplicate key error and we have attempts left, retry
          if (error.code === '23505' && attempts < maxAttempts) {
            console.log(`🔍 Retrying profile upsert (attempt ${attempts + 1}/${maxAttempts})`);
            // Add a small delay before retry
            await new Promise(resolve => setTimeout(resolve, 100 * attempts));
            continue;
          }
          
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }
        
        profileCreated = true;
      }
      
      if (!profileCreated) {
        return NextResponse.json({ ok: false, error: "Failed to create profile after multiple attempts" }, { status: 500 });
      }
      
      console.log('🔍 Profile upserted successfully for user:', u.id);
    } else {
      console.log('🔍 Webhook event type not handled:', evt.type);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('🔍 Webhook processing error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
}
