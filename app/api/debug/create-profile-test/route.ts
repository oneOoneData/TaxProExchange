import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseService() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    // Test 1: Check if profiles table exists and get its structure
    const tableResult = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (tableResult.error) {
      return NextResponse.json({ 
        error: 'Failed to get table info', 
        details: tableResult.error.message 
      }, { status: 500 });
    }

    // Test 2: Try to get a sample profile to see the structure
    const sampleResult = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    // Test 3: Check if clerk_id column exists
    const clerkIdColumn = tableResult.data?.find(col => col.column_name === 'clerk_id');
    
    // Test 4: Check constraints
    const constraintResult = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    return NextResponse.json({
      userId,
      tableStructure: tableResult.data,
      sampleProfile: sampleResult.data?.[0] || null,
      clerkIdColumn: clerkIdColumn,
      constraints: constraintResult.data,
      errors: {
        tableError: tableResult.error ? tableResult.error.message : null,
        sampleError: sampleResult.error ? sampleResult.error.message : null,
        constraintError: constraintResult.error ? constraintResult.error.message : null
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
