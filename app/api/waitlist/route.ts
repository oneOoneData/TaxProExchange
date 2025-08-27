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

    // Redirect to confirmation page with query parameters
    const redirectUrl = new URL('/waitlist/confirmation', request.url);
    redirectUrl.searchParams.set('email', email);
    if (roleInterest) redirectUrl.searchParams.set('role', roleInterest);

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Waitlist submission error:', error);
    
    // Redirect to confirmation page with error parameter
    const redirectUrl = new URL('/waitlist/confirmation', request.url);
    redirectUrl.searchParams.set('error', 'true');
    
    return NextResponse.redirect(redirectUrl);
  }
}
