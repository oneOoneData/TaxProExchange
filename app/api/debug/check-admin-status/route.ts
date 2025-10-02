import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Not authenticated",
        userId: null,
        isAdmin: false
      });
    }

    const supabase = createServerClient();

    // Get user profile with admin status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, clerk_id, full_name, is_admin')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        userId,
        isAdmin: false,
        profile: null
      });
    }

    return NextResponse.json({
      userId,
      isAdmin: profile?.is_admin === true,
      profile: {
        id: profile.id,
        clerk_id: profile.clerk_id,
        full_name: profile.full_name,
        is_admin: profile.is_admin
      },
      message: "Admin status check complete"
    });

  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
