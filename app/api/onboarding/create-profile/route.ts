import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // This endpoint is no longer used - users go directly to profile edit
  return NextResponse.json({ 
    error: 'This endpoint is deprecated. Users should go directly to profile edit.',
    redirect: '/profile/edit'
  }, { status: 410 });
}