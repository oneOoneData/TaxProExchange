import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

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
      contactEmail,
      contactName,
      additionalInfo
    } = body;

    // Validate required fields
    if (!title || !description || !startDate || !eventUrl || !organizer || !contactEmail || !contactName) {
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: "User profile not found" 
      }, { status: 500 });
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
      organizer: organizer.trim(),
      region: locationState || 'CA', // Default region
      source: 'user_suggestion',
      review_status: 'pending_review',
      
      // User suggestion metadata
      suggested_by: profile.id,
      suggested_at: new Date().toISOString(),
      contact_name: contactName.trim(),
      contact_email: contactEmail.trim(),
      additional_info: additionalInfo?.trim() || null,
      
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
