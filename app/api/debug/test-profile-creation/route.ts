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

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    // Generate a unique slug
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const slug = `test-profile-${timestamp}-${random}`;
    
    // Try with absolute minimum fields first
    const minimalData = {
      clerk_id: userId,
      first_name: 'Test',
      last_name: 'User',
      credential_type: 'Other',
      slug: slug
    };

    console.log('🔍 Testing minimal profile creation with:', minimalData);

    const { data, error } = await supabase
      .from('profiles')
      .insert(minimalData)
      .select();

    if (error) {
      console.error('❌ Minimal profile creation failed:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        data: minimalData
      }, { status: 400 });
    }

    console.log('✅ Minimal profile creation succeeded:', data);

    // Clean up the test profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', data[0].id);

    return NextResponse.json({
      success: true,
      message: 'Profile creation test passed',
      createdProfile: data[0]
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
