import { NextResponse } from 'next/server';
import { getServerStreamClient } from '@/lib/stream';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const client = getServerStreamClient();

  // Use Clerk userId as Stream user id
  const streamUserId = userId;

  // Upsert user info in Stream (name, image)
  await client.upsertUser({
    id: streamUserId,
    name: user?.fullName ?? 'User',
    image: user?.imageUrl,
  });

  const token = client.createToken(streamUserId);
  return NextResponse.json({ token, userId: streamUserId, key: process.env.STREAM_KEY });
}
