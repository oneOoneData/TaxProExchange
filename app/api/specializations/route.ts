import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface Specialization {
  id: string;
  slug: string;
  label: string;
  group_key: string;
}

interface SpecializationGroup {
  key: string;
  label: string;
  items: Specialization[];
}

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Fetch all specializations with their groups
    const { data: specializations, error } = await supabase
      .from('specializations')
      .select('*')
      .order('label');

    if (error) {
      console.error('Specializations fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch specializations' },
        { status: 500 }
      );
    }

    // Fetch all groups
    const { data: groups, error: groupsError } = await supabase
      .from('specialization_groups')
      .select('*')
      .order('label');

    if (groupsError) {
      console.error('Groups fetch error:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch specialization groups' },
        { status: 500 }
      );
    }

    // Group specializations by their group_key
    const groupedSpecializations: SpecializationGroup[] = groups.map(group => ({
      key: group.key,
      label: group.label,
      items: specializations.filter(spec => spec.group_key === group.key)
    }));

    return NextResponse.json(groupedSpecializations);
  } catch (error) {
    console.error('Specializations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
