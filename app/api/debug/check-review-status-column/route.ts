import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Check if user has admin role in the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .eq('is_admin', true)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Check if review_status column exists
    const { data: columnCheck, error: columnError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, column_default, is_nullable")
      .eq("table_name", "events")
      .eq("column_name", "review_status")
      .single();

    // Check all columns in events table
    const { data: allColumns, error: allColumnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, column_default, is_nullable")
      .eq("table_name", "events")
      .order("ordinal_position", { ascending: true });

    // Try to query events with review_status
    const { data: eventsWithReview, error: eventsError } = await supabase
      .from("events")
      .select("id, title, review_status")
      .limit(5);

    return NextResponse.json({
      columnCheck: columnCheck || null,
      columnError: columnError?.message || null,
      allColumns: allColumns || [],
      allColumnsError: allColumnsError?.message || null,
      eventsWithReview: eventsWithReview || [],
      eventsError: eventsError?.message || null,
      debug: {
        columnExists: !!columnCheck,
        eventsQueryWorked: !eventsError,
        totalColumns: allColumns?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in debug review status API:', error);
    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
