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

    // Send test email
    await sendVerifiedListedEmail({
      to: email,
      firstName: firstName || 'Test User',
      slug: slug,
    });

    return NextResponse.json({
      success: true,
      message: 'Verified + listed email sent successfully'
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
