import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
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

    return NextResponse.json(specializations);
  } catch (error) {
    console.error('Specializations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
