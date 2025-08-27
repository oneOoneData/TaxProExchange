import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ 
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
    env: {
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: "POST method works",
    timestamp: new Date().toISOString()
  });
}
