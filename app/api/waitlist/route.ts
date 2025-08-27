import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const roleInterest = formData.get('role_interest') as string;
    const notes = formData.get('notes') as string;
    const source = formData.get('source') as string;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // For now, we'll just log the submission
    // Later this will be replaced with Supabase database insertion
    console.log('Waitlist submission:', {
      email,
      role_interest: roleInterest,
      notes,
      source,
      timestamp: new Date().toISOString()
    });

    // TODO: Insert into Supabase waitlist table when database is ready
    // const { data, error } = await supabase
    //   .from('waitlist')
    //   .insert([{ email, role_interest: roleInterest, notes, source }]);

    // if (error) throw error;

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
        error: 'Failed to join waitlist',
        redirectUrl: '/waitlist/confirmation?error=true'
      },
      { status: 500 }
    );
  }
}
