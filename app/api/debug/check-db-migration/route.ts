import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Check if the notified_verified_listed_at column exists
    // We test by trying to select the column with limit 0 (doesn't return data but validates column exists)
    const { data: testData, error: columnError } = await supabase
      .from('profiles')
      .select('notified_verified_listed_at')
      .limit(0);

    const columnExists = !columnError;
    let columnDetails = null;
    
    if (columnExists) {
      // If column exists, get its details by querying a sample row
      const { data: sampleData, error: sampleError } = await supabase
        .from('profiles')
        .select('notified_verified_listed_at')
        .limit(1);
      
      if (!sampleError && sampleData && sampleData.length > 0) {
        const firstRow = sampleData[0];
        columnDetails = {
          column_name: 'notified_verified_listed_at',
          data_type: typeof firstRow.notified_verified_listed_at === 'string' ? 'timestamp' : 'unknown',
          is_nullable: firstRow.notified_verified_listed_at === null
        };
      } else if (!sampleError) {
        // Column exists but no rows to sample
        columnDetails = {
          column_name: 'notified_verified_listed_at',
          data_type: 'timestamp',
          is_nullable: true
        };
      }
    }

    // Check environment variables
    const envCheck = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM || 'support@taxproexchange.com',
      SITE_URL: process.env.SITE_URL || 'https://www.taxproexchange.com',
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!supabaseKey,
    };

    return NextResponse.json({
      success: true,
      migration: {
        column_exists: columnExists,
        column_details: columnDetails
      },
      environment: envCheck
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
