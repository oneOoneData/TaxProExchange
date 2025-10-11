/**
 * Firm Team/Bench Item API Routes
 * 
 * PATCH /api/firm-team/[id] - Update a bench item
 * DELETE /api/firm-team/[id] - Remove a bench item
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import { isActiveFirmMember } from '@/lib/authz';
import { z } from 'zod';

// Validation schema
const UpdateBenchItemSchema = z.object({
  custom_title: z.string().max(80).optional(),
  categories: z.array(z.string()).max(8).optional(),
  note: z.string().max(500).optional(),
  visibility_public: z.boolean().optional(),
});

/**
 * PATCH /api/firm-team/[id]
 * Update a bench item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateBenchItemSchema.parse(body);

    const supabase = createServerClient();

    // Get bench item to verify firm ownership
    const { data: item, error: fetchError } = await supabase
      .from('firm_trusted_bench')
      .select('firm_id')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Bench item not found' }, { status: 404 });
    }

    // Check membership
    const isMember = await isActiveFirmMember(userId, item.firm_id);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update bench item
    const { data, error } = await supabase
      .from('firm_trusted_bench')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bench item:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/firm-team/[id]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/firm-team/[id]
 * Remove a bench item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerClient();

    // Get bench item to verify firm ownership
    const { data: item, error: fetchError } = await supabase
      .from('firm_trusted_bench')
      .select('firm_id')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Bench item not found' }, { status: 404 });
    }

    // Check membership
    const isMember = await isActiveFirmMember(userId, item.firm_id);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete bench item
    const { error } = await supabase
      .from('firm_trusted_bench')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bench item:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/firm-team/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

