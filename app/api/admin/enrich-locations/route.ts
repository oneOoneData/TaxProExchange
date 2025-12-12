import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { enrichLocations } from '@/lib/enrichLocations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Check if user is admin
async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { isAdmin: false, userId: null };
  }

  const supabase = createServerClient();
  // Try both clerk_id and user_id for compatibility
  let { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('clerk_id', userId)
    .single();
  
  // Fallback to user_id if clerk_id didn't find anything
  if (!profile) {
    const result = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    profile = result.data;
  }

  return { isAdmin: profile?.is_admin === true, userId };
}

// POST /api/admin/enrich-locations - Run location enrichment job
export async function POST(request: NextRequest) {
  console.log('🔍 [Enrich Locations API] POST /api/admin/enrich-locations called');
  
  try {
    // Check admin permission
    const { isAdmin } = await checkAdmin();
    
    if (!isAdmin) {
      console.log('🔍 [Enrich Locations API] Unauthorized - not admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('🔍 [Enrich Locations API] Starting location enrichment job...');
    const startTime = Date.now();

    // Run enrichment
    const result = await enrichLocations();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ [Enrich Locations API] Job completed in ${duration}s`);
    console.log(`📊 [Enrich Locations API] Results:`, result);

    return NextResponse.json({
      status: 'ok',
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.length,
      duration: `${duration}s`
    });
  } catch (error) {
    console.error('❌ [Enrich Locations API] Error running enrichment:', error);
    console.error('❌ [Enrich Locations API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

