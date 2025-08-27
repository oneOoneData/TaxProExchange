import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const roleInterest = formData.get('role_interest') as string;
    const notes = formData.get('notes') as string;
    const source = formData.get('source') || 'website';

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Insert into Supabase waitlist table
    const { data, error } = await supabase
      .from('waitlist')
      .insert([{ 
        email, 
        role_interest: roleInterest || null, 
        notes: notes || null, 
        source 
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Waitlist submission saved:', data);

    // Return success response with redirect URL
    return NextResponse.json({
      success: true,
      message: 'Successfully joined waitlist',
      redirectUrl: `/waitlist/confirmation?email=${encodeURIComponent(email)}${roleInterest ? `&role=${encodeURIComponent(roleInterest)}` : ''}`
    });

  } catch (error) {
    console.error('Waitlist submission error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to join waitlist',
        redirectUrl: '/waitlist/confirmation?error=true'
      },
      { status: 500 }
    );
  }
}
