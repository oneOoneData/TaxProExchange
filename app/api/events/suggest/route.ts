import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      startDate,
      endDate,
      locationCity,
      locationState,
      eventUrl,
      organizer,
      additionalInfo,
      recaptchaToken
    } = body;

    // Verify reCAPTCHA token (with lower threshold for public forms)
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, 0.3);
      if (!recaptchaResult.success) {
        return NextResponse.json({ 
          error: recaptchaResult.error || "Failed bot protection check" 
        }, { status: 400 });
      }
    }

    // Check if user is authenticated (optional for this endpoint)
    const { userId } = await auth();

    // Validate required fields
    if (!title || !description || !startDate || !eventUrl || !organizer) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // Validate date
    const eventDate = new Date(startDate);
    const now = new Date();
    
    // Reject events that are more than 1 day in the past
    if (eventDate < new Date(now.getTime() - 24*60*60*1000)) {
      return NextResponse.json({ 
        error: "Event date must be in the future" 
      }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get user profile if authenticated
    let profile = null;
    let userName = 'Anonymous';
    let userEmail = 'anonymous@taxproexchange.com';

    if (userId) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('clerk_id', userId)
        .single();

      if (userProfile) {
        profile = userProfile;
        userName = `${profile.first_name} ${profile.last_name}`.trim();
        userEmail = profile.email;
      }
    }

    // Create event suggestion
    const eventSuggestion = {
      title: title.trim(),
      description: description.trim(),
      start_date: startDate,
      end_date: endDate || null,
      location_city: locationCity?.trim() || null,
      location_state: locationState || null,
      candidate_url: eventUrl.trim(),
      url: eventUrl.trim(), // Set url field to satisfy NOT NULL constraint
      organizer: organizer.trim(),
      region: locationState || 'CA', // Default region
      source: 'user_suggestion', // User-suggested events
      review_status: 'pending_review',
      
      // User suggestion metadata
      suggested_by: profile?.id || null,
      suggested_at: new Date().toISOString(),
      admin_notes: `Suggested by: ${userName} (${userEmail}). ${additionalInfo ? `Additional info: ${additionalInfo}` : ''}`,
      
      // Link health fields (will be validated later)
      canonical_url: null,
      url_status: null,
      redirect_chain: [],
      link_health_score: 0,
      last_checked_at: null,
      publishable: false
    };

    // Insert the event suggestion
    const { data: insertedEvent, error: insertError } = await supabase
      .from('events')
      .insert(eventSuggestion)
      .select('id, title')
      .single();

    if (insertError) {
      console.error('Error inserting event suggestion:', insertError);
      return NextResponse.json({ 
        error: "Failed to submit event suggestion" 
      }, { status: 500 });
    }

    // TODO: Send notification email to admin about new event suggestion

    return NextResponse.json({
      success: true,
      message: "Event suggestion submitted successfully",
      eventId: insertedEvent.id,
      eventTitle: insertedEvent.title
    });

  } catch (error) {
    console.error('Error in event suggestion API:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
