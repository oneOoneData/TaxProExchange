import { NextRequest, NextResponse } from 'next/server';
import { sendProfileCompletionNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to, profileId = 'test-profile-123' } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    // Create test data for the admin approval email
    const testData = {
      profileId: profileId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      credentialType: 'CPA',
      ptin: 'P123456789',
      headline: 'Senior Tax Professional with 10+ years experience',
      firmName: 'Doe & Associates',
      isListed: true,
      visibilityState: 'pending_verification',
      adminViewLink: `${process.env.NEXT_PUBLIC_APP_URL}/p/test-profile?admin=true`,
      approveLink: `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/email-approve?profileId=${profileId}&action=approve`,
      rejectLink: `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/email-approve?profileId=${profileId}&action=reject`
    };

    console.log('📧 Sending test admin approval email to:', to);
    console.log('📧 Test data:', testData);

    await sendProfileCompletionNotification(testData);

    return NextResponse.json({
      success: true,
      message: 'Test admin approval email sent successfully',
      testData,
      note: 'Check your email for the admin approval notification with direct approve/reject buttons'
    });

  } catch (error) {
    console.error('Test admin approval email error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send test admin approval email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Admin approval email test endpoint',
    usage: 'POST with { "to": "admin@example.com", "profileId": "optional-profile-id" }',
    features: [
      'Tests the complete admin approval email flow',
      'Includes direct approve/reject buttons',
      'Shows admin view link',
      'Uses real email template'
    ],
    example: {
      to: 'admin@example.com',
      profileId: 'test-profile-123'
    }
  });
}
