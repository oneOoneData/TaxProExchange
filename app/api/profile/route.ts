// app/api/profile/route.ts
import { NextResponse } from 'next/server';

// Temporary no-op handlers to prevent 500s while migrating to server-side onboarding.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clerkId = searchParams.get('clerk_id') ?? null;
  return NextResponse.json({ ok: true, clerk_id: clerkId });
}

export async function POST(_request: Request) {
  return NextResponse.json({ ok: true });
}
