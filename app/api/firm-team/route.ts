/**
 * Firm Team/Bench API Routes
 * 
 * GET /api/firm-team?firm_id=... - List bench items for a firm
 * POST /api/firm-team - Add a profile to the firm's bench
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import { isActiveFirmMember, getProfileIdFromClerkId } from '@/lib/authz';
import { z } from 'zod';

// Validation schema
const CreateBenchItemSchema = z.object({
  firm_id: z.string().uuid(),
  trusted_profile_id: z.string().uuid(),
  custom_title: z.string().max(80).optional(),
  categories: z.array(z.string()).max(8).default([]),
  note: z.string().max(500).optional(),
  visibility_public: z.boolean().default(false),
});

/**
 * GET /api/firm-team
 * List bench items for a firm (member access only)
 */
export async function GET(request: NextRequest) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const firmId = searchParams.get('firm_id');

    if (!firmId) {
      return NextResponse.json({ error: 'firm_id required' }, { status: 400 });
    }

    // Check membership
    const isMember = await isActiveFirmMember(userId, firmId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const supabase = createServerClient();

    // Fetch bench items with profile data
    const { data, error } = await supabase
      .from('firm_trusted_bench')
      .select(`
        id,
        custom_title,
        categories,
        note,
        priority,
        visibility_public,
        created_at,
        profiles:trusted_profile_id (
          id,
          first_name,
          last_name,
          credential_type,
          slug,
          firm_name,
          avatar_url,
          image_url,
          headline,
          is_listed,
          visibility_state
        )
      `)
      .eq('firm_id', firmId)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching bench items:', error);
      return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      items: data || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/firm-team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/firm-team
 * Add a profile to the firm's bench
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
    const validatedData = CreateBenchItemSchema.parse(body);

    // Check membership
    const isMember = await isActiveFirmMember(userId, validatedData.firm_id);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const supabase = createServerClient();

    // Check if profile already exists in bench
    const { data: existing } = await supabase
      .from('firm_trusted_bench')
      .select('id')
      .eq('firm_id', validatedData.firm_id)
      .eq('trusted_profile_id', validatedData.trusted_profile_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Profile already in team' },
        { status: 409 }
      );
    }

    // Get min priority or default to 100
    const { data: minItem } = await supabase
      .from('firm_trusted_bench')
      .select('priority')
      .eq('firm_id', validatedData.firm_id)
      .order('priority', { ascending: true })
      .limit(1)
      .single();

    const priority = minItem ? minItem.priority - 1 : 100;

    // Insert bench item
    const { data, error } = await supabase
      .from('firm_trusted_bench')
      .insert({
        firm_id: validatedData.firm_id,
        trusted_profile_id: validatedData.trusted_profile_id,
        custom_title: validatedData.custom_title || null,
        categories: validatedData.categories,
        note: validatedData.note || null,
        visibility_public: validatedData.visibility_public,
        priority,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding bench item:', error);
      return NextResponse.json({ error: 'Failed to add to team' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch (error: any) {
    console.error('Error in POST /api/firm-team:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

