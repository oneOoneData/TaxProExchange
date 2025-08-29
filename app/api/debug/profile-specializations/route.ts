import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Check the table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('profile_specializations')
      .select('*')
      .limit(5);

    if (tableError) {
      return NextResponse.json(
        { error: 'Table error: ' + tableError.message },
        { status: 500 }
      );
    }

    // Check if there are any specializations
    const { count: totalCount } = await supabase
      .from('profile_specializations')
      .select('*', { count: 'exact', head: true });

    // Check a specific profile's specializations
    const { data: profileSpecs, error: profileError } = await supabase
      .from('profile_specializations')
      .select(`
        profile_id,
        specialization_slug,
        profiles!inner(first_name, last_name)
      `)
      .limit(10);

    return NextResponse.json({
      tableStructure: tableInfo,
      totalCount,
      profileSpecializations: profileSpecs,
      errors: {
        table: tableError?.message,
        profile: profileError?.message
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
