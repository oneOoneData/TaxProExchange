import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: 'Deployment test endpoint working',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
