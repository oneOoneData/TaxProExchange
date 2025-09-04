import { NextResponse } from 'next/server';
import { getServerStreamClient } from '@/lib/stream';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const client = getServerStreamClient();

  // Get user's profile ID from database
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .eq('clerk_id', userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Use profile ID as Stream user id
  const streamUserId = profile.id;

  // Upsert user info in Stream (name, image)
  await client.upsertUser({
    id: streamUserId,
    name: `${profile.first_name} ${profile.last_name}`,
    image: profile.avatar_url,
  });

  const token = client.createToken(streamUserId);
  return NextResponse.json({ token, userId: streamUserId, key: process.env.STREAM_KEY });
}
