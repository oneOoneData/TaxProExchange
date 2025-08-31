import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseService();
    
    // Check if email_preferences column exists
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public')
      .in('column_name', ['email_preferences', 'email_frequency', 'last_email_sent']);

    if (columnsError) {
      return NextResponse.json({ error: 'Failed to check columns', details: columnsError }, { status: 500 });
    }

    // Check current profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, clerk_id, email_preferences, email_frequency, last_email_sent')
      .eq('clerk_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch profile', details: profileError }, { status: 500 });
    }

    return NextResponse.json({
      columns: columns || [],
      profile: profile || null,
      hasEmailPreferences: !!profile?.email_preferences,
      emailPreferencesValue: profile?.email_preferences
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
