/**
 * Firm Team/Bench Reorder API Route
 * 
 * POST /api/firm-team/reorder - Bulk update priorities
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import { isActiveFirmMember } from '@/lib/authz';
import { z } from 'zod';

// Validation schema
const ReorderSchema = z.object({
  firm_id: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      priority: z.number().int(),
    })
  ),
});

/**
 * POST /api/firm-team/reorder
 * Bulk update priorities for bench items
 */
export async function POST(request: NextRequest) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ReorderSchema.parse(body);

    // Check membership
    const isMember = await isActiveFirmMember(userId, validatedData.firm_id);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const supabase = createServerClient();

    // Update each item's priority
    const updates = validatedData.items.map((item) =>
      supabase
        .from('firm_trusted_bench')
        .update({ priority: item.priority })
        .eq('id', item.id)
        .eq('firm_id', validatedData.firm_id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error('Error updating priorities:', errors);
      return NextResponse.json(
        { error: 'Failed to update some items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: validatedData.items.length,
    });
  } catch (error: any) {
    console.error('Error in POST /api/firm-team/reorder:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

