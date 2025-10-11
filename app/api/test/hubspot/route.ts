/**
 * HubSpot Integration Test Endpoint
 * Visit /api/test/hubspot to check if HubSpot is working
 */

import { NextResponse } from 'next/server';
import { upsertHubSpotContact } from '@/lib/hubspot';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    checks: {},
    message: '',
  };

  try {
    // 1. Check environment variables
    const hasToken = !!process.env.HUBSPOT_TOKEN;
    const hasApiKey = !!process.env.HUBSPOT_API_KEY;
    
    diagnostics.checks.credentials = {
      hasToken,
      hasApiKey,
      configured: hasToken || hasApiKey,
    };

    if (!hasToken && !hasApiKey) {
      diagnostics.status = 'not_configured';
      diagnostics.message = 'HubSpot is NOT configured. Please set HUBSPOT_TOKEN or HUBSPOT_API_KEY in your environment variables.';
      diagnostics.setup_instructions = {
        step1: 'Go to HubSpot Settings > Integrations > Private Apps',
        step2: 'Create a new Private App',
        step3: 'Enable CRM scopes: crm.objects.contacts.read and crm.objects.contacts.write',
        step4: 'Copy the token and add to .env as HUBSPOT_TOKEN=your_token',
      };
      
      return NextResponse.json(diagnostics, { status: 200 });
    }

    // 2. Test sync with a test contact
    const testEmail = `test+${Date.now()}@taxproexchange.com`;
    
    diagnostics.checks.test_sync = {
      email: testEmail,
      attempting: true,
    };

    const result = await upsertHubSpotContact({
      email: testEmail,
      firstname: 'Test',
      lastname: 'Integration',
      marketing_opt_in: false,
    });

    if (!result.ok) {
      diagnostics.status = 'error';
      diagnostics.message = 'HubSpot sync failed. Check the error details below.';
      diagnostics.checks.test_sync = {
        ...diagnostics.checks.test_sync,
        success: false,
        error: {
          reason: result.reason,
          status: result.status,
          error: result.error,
        },
      };
      
      if (result.reason === 'search_failed' || result.reason === 'create_failed') {
        diagnostics.troubleshooting = [
          'Invalid or expired API token',
          'Insufficient permissions (need CRM scope)',
          'HubSpot account or API issues',
        ];
      }
      
      return NextResponse.json(diagnostics, { status: 200 });
    }

    // Success!
    diagnostics.status = 'working';
    diagnostics.message = '✅ HubSpot integration is working correctly!';
    diagnostics.checks.test_sync = {
      ...diagnostics.checks.test_sync,
      success: true,
      operation: result.op,
      contactId: result.contactId,
    };
    
    diagnostics.next_steps = {
      verify: 'Go to HubSpot Contacts and search for: ' + testEmail,
      custom_property: 'Make sure you have the custom property "tpe_marketing_opt_in" configured in HubSpot if you want to track marketing consent.',
    };

    return NextResponse.json(diagnostics, { status: 200 });
    
  } catch (error: any) {
    diagnostics.status = 'error';
    diagnostics.message = 'Unexpected error occurred';
    diagnostics.error = {
      message: error?.message,
      stack: error?.stack,
    };
    
    return NextResponse.json(diagnostics, { status: 500 });
  }
}

