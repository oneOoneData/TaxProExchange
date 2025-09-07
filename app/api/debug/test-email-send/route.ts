import { NextRequest, NextResponse } from 'next/server';
import { sendVerifiedListedEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, slug } = await request.json();

    if (!email || !slug) {
      return NextResponse.json(
        { error: 'Email and slug are required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing email send with:', { email, firstName, slug });

    // Test email send
    const result = await sendVerifiedListedEmail({
      to: email,
      firstName: firstName || 'Test User',
      slug: slug,
    });

    console.log('📧 Email send result:', result);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
