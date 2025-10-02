import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

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

// GET - Fetch events for review
export async function GET() {
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

    const supabase = createServerClient();

    // Get all events with review status
    const { data: events, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        location_city,
        location_state,
        candidate_url,
        canonical_url,
        url_status,
        link_health_score,
        last_checked_at,
        review_status,
        admin_notes,
        tags,
        organizer,
        reviewed_at,
        reviewed_by
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching events for review:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: events || [],
      summary: {
        total: events?.length || 0,
        pendingReview: events?.filter(e => e.review_status === 'pending_review').length || 0,
        approved: events?.filter(e => e.review_status === 'approved').length || 0,
        rejected: events?.filter(e => e.review_status === 'rejected').length || 0
      }
    });

  } catch (error) {
    console.error("Error in events review GET:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// PATCH - Update event review status
export async function PATCH(req: Request) {
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

    const { eventId, status, notes } = await req.json();

    if (!eventId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get admin profile ID
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !adminProfile) {
      return NextResponse.json({ error: "Admin profile not found" }, { status: 500 });
    }

    // Update event review status
    const updateData: any = {
      review_status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminProfile.id
    };

    if (notes) {
      updateData.admin_notes = notes;
    }

    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      console.error("Error updating event review status:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Admin ${userId} updated event ${eventId} status to ${status}`);

    return NextResponse.json({
      success: true,
      event: data,
      message: `Event ${status} successfully`
    });

  } catch (error) {
    console.error("Error in events review PATCH:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
