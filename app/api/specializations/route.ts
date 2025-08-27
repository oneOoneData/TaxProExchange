import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Fetch all specializations
    const { data: specializations, error } = await supabase
      .from('specializations')
      .select('id, slug, label')
      .order('label');

    if (error) {
      console.error('Supabase specializations error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json(specializations || []);

  } catch (error) {
    console.error('Specializations fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
