import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    version: 'v1.2.3-debug',
    timestamp: new Date().toISOString(),
    hasAutoCreate: true,
    message: 'Debug version with automatic Stream channel creation'
  });
}
