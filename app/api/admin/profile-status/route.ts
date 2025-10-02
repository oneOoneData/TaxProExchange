import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseService();
    
    // Get profile details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, slug, first_name, last_name, visibility_state, is_listed, created_at, updated_at')
      .eq('slug', slug)
      .single();

    if (error || !profile) {
      return NextResponse.json({
        found: false,
        slug,
        error: error?.message || 'Profile not found'
      });
    }

    return NextResponse.json({
      found: true,
      profile: {
        id: profile.id,
        slug: profile.slug,
        name: `${profile.first_name} ${profile.last_name}`,
        visibility_state: profile.visibility_state,
        is_listed: profile.is_listed,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        is_visible: profile.is_listed && profile.visibility_state === 'verified'
      }
    });

  } catch (error) {
    console.error('Profile status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { slug, action } = await request.json();
    
    if (!slug || !action) {
      return NextResponse.json(
        { error: 'Slug and action are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseService();
    
    // Get profile first
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, slug, first_name, last_name, visibility_state, is_listed')
      .eq('slug', slug)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found'
      });
    }

    let updateData: any = {};
    
    switch (action) {
      case 'verify':
        updateData = {
          visibility_state: 'verified',
          updated_at: new Date().toISOString()
        };
        break;
      case 'list':
        updateData = {
          is_listed: true,
          updated_at: new Date().toISOString()
        };
        break;
      case 'verify_and_list':
        updateData = {
          visibility_state: 'verified',
          is_listed: true,
          updated_at: new Date().toISOString()
        };
        break;
      case 'hide':
        updateData = {
          visibility_state: 'hidden',
          is_listed: false,
          updated_at: new Date().toISOString()
        };
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: verify, list, verify_and_list, or hide'
        });
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile'
      });
    }

    return NextResponse.json({
      success: true,
      message: `Profile ${action} successful`,
      profile: {
        id: profile.id,
        slug: profile.slug,
        name: `${profile.first_name} ${profile.last_name}`,
        action,
        updated_at: updateData.updated_at
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
