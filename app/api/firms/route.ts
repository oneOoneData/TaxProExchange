/**
 * Firms API Routes
 * 
 * POST /api/firms - Create a new firm (user becomes admin)
 * GET /api/firms - List firms where user is a member
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import { getProfileIdFromClerkId } from '@/lib/authz';
import { z } from 'zod';

// Validation schemas
const CreateFirmSchema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().url().optional().or(z.literal('')),
  size_band: z.enum(['1-4', '5-10', '11-25', '26-50', '50+']).optional(),
  returns_band: z.enum(['<100', '<1,000', '<5,000', '5,000+']).optional(),
});

// Helper to generate slug from firm name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

/**
 * POST /api/firms
 * Create a new firm workspace
 */
export async function POST(request: NextRequest) {
  // Feature gate
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json(
      { error: 'Feature not available' },
      { status: 404 }
    );
  }

  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateFirmSchema.parse(body);

    const supabase = createServerClient();

    // Get user's profile ID, or create firm_admin profile if none exists
    let profileId = await getProfileIdFromClerkId(userId);
    
    if (!profileId) {
      // Auto-create a minimal firm_admin profile
      console.log('No profile found, creating firm_admin profile for:', userId);
      
      // Get user info from Clerk
      const { currentUser } = await import('@clerk/nextjs/server');
      const user = await currentUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userEmail = user.emailAddresses[0]?.emailAddress;
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      
      // Generate slug
      const slugBase = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const profileSlug = `${slugBase}-${userId.substring(0, 8)}`;

      // Create firm_admin profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          clerk_user_id: userId,
          clerk_id: userId,
          first_name: firstName,
          last_name: lastName,
          public_email: userEmail,
          profile_type: 'firm_admin',
          slug: profileSlug,
          onboarding_complete: true,
          is_listed: false, // Never list firm admins
          visibility_state: 'unlisted',
        })
        .select('id')
        .single();

      if (profileError || !newProfile) {
        console.error('Error creating firm_admin profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to create admin profile' },
          { status: 500 }
        );
      }

      profileId = newProfile.id;
      console.log('Created firm_admin profile:', profileId);
    }

    // Generate unique slug
    let slug = generateSlug(validatedData.name);
    let slugExists = true;
    let attempts = 0;

    while (slugExists && attempts < 10) {
      const { data } = await supabase
        .from('firms')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!data) {
        slugExists = false;
      } else {
        slug = `${generateSlug(validatedData.name)}-${Math.random().toString(36).substring(7)}`;
        attempts++;
      }
    }

    // Create firm
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .insert({
        name: validatedData.name,
        website: validatedData.website || null,
        size_band: validatedData.size_band || null,
        returns_band: validatedData.returns_band || null,
        slug,
      })
      .select()
      .single();

    if (firmError || !firm) {
      console.error('Error creating firm:', firmError);
      return NextResponse.json(
        { error: 'Failed to create firm' },
        { status: 500 }
      );
    }

    // Add user as admin member
    const { error: memberError } = await supabase
      .from('firm_members')
      .insert({
        firm_id: firm.id,
        profile_id: profileId,
        role: 'admin',
        status: 'active',
      });

    if (memberError) {
      console.error('Error adding admin member:', memberError);
      // Rollback: delete the firm
      await supabase.from('firms').delete().eq('id', firm.id);
      return NextResponse.json(
        { error: 'Failed to create firm membership' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      firm,
    });
  } catch (error: any) {
    console.error('Error in POST /api/firms:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/firms
 * List firms where user is an active member
 */
export async function GET(request: NextRequest) {
  // Feature gate
  if (!FEATURE_FIRM_WORKSPACES) {
    return NextResponse.json(
      { error: 'Feature not available' },
      { status: 404 }
    );
  }

  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile ID
    const profileId = await getProfileIdFromClerkId(userId);
    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const supabase = createServerClient();

    // Get firms where user is active member
    const { data, error } = await supabase
      .from('firm_members')
      .select(`
        firm_id,
        role,
        status,
        firms (
          id,
          name,
          website,
          size_band,
          returns_band,
          verified,
          slug,
          created_at,
          subscription_status,
          stripe_customer_id,
          subscription_current_period_end,
          trial_ends_at
        )
      `)
      .eq('profile_id', profileId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching firms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch firms' },
        { status: 500 }
      );
    }

    // Transform data
    const firms = (data || []).map((item: any) => ({
      ...item.firms,
      user_role: item.role,
    }));

    return NextResponse.json({
      success: true,
      firms,
    });
  } catch (error: any) {
    console.error('Error in GET /api/firms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

