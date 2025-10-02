import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

// Helper function to verify admin status
async function verifyAdminStatus(): Promise<boolean> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return false;
    }

    const supabase = createServerClient();

    // Check if user has admin role in the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .eq('is_admin', true)
      .single();

    return !error && profile?.is_admin === true;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

// Helper function to create deduplication key
function makeDedupeKey(title: string, startsAt: string, organizer?: string): string {
  const base = `${(title || "").toLowerCase()}|${startsAt}|${(organizer || "").toLowerCase()}`;
  return crypto.createHash("sha1").update(base).digest("hex");
}

export async function POST(req: Request) {
  try {
    // Check admin authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await verifyAdminStatus();
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
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
      tags,
      reviewStatus
    } = body;

    // Validate required fields
    if (!title || !description || !startDate || !eventUrl || !organizer) {
      return NextResponse.json({ 
        error: "Missing required fields: title, description, startDate, eventUrl, organizer" 
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

    // Get admin profile
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !adminProfile) {
      return NextResponse.json({ 
        error: "Admin profile not found" 
      }, { status: 500 });
    }

    // Parse tags
    const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];

    // Create event
    const eventData = {
      title: title.trim(),
      description: description.trim(),
      start_date: startDate,
      end_date: endDate || null,
      location_city: locationCity?.trim() || null,
      location_state: locationState || null,
      candidate_url: eventUrl.trim(),
      canonical_url: eventUrl.trim(), // Admin-created events are trusted
      organizer: organizer.trim(),
      region: locationState || 'CA',
      source: 'admin_created',
      tags: tagsArray,
      dedupe_key: makeDedupeKey(title.trim(), startDate, organizer.trim()),
      
      // Review status
      review_status: reviewStatus || 'approved',
      reviewed_at: reviewStatus === 'approved' ? new Date().toISOString() : null,
      reviewed_by: reviewStatus === 'approved' ? adminProfile.id : null,
      
      // Link health fields (admin-created events are trusted)
      url_status: 200,
      redirect_chain: [],
      link_health_score: 100, // Trust admin-created URLs
      last_checked_at: new Date().toISOString(),
      publishable: reviewStatus === 'approved'
    };

    // Insert the event
    const { data: insertedEvent, error: insertError } = await supabase
      .from('events')
      .insert(eventData)
      .select('id, title, review_status')
      .single();

    if (insertError) {
      console.error('Error inserting admin-created event:', insertError);
      return NextResponse.json({ 
        error: "Failed to add event" 
      }, { status: 500 });
    }

    console.log(`Admin ${userId} created event: ${insertedEvent.id}`);

    return NextResponse.json({
      success: true,
      message: "Event added successfully",
      eventId: insertedEvent.id,
      eventTitle: insertedEvent.title,
      reviewStatus: insertedEvent.review_status
    });

  } catch (error) {
    console.error('Error in admin add event API:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
