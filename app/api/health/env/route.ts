import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const present = (k: string) => Boolean(process.env[k]?.length);

  return NextResponse.json({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: present("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    CLERK_SECRET_KEY: present("CLERK_SECRET_KEY"),
    SUPABASE_URL: present("SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_URL: present("NEXT_PUBLIC_SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: present("SUPABASE_SERVICE_ROLE_KEY"),
    SUPABASE_ANON_KEY: present("SUPABASE_ANON_KEY"),
    STRIPE_SECRET_KEY: present("STRIPE_SECRET_KEY"),
    STRIPE_PRACTICE_WEBHOOK_SECRET: present("STRIPE_PRACTICE_WEBHOOK_SECRET"),
    OPENAI_API_KEY: present("OPENAI_API_KEY"),
    RESEND_API_KEY: present("RESEND_API_KEY"),
    WEBHOOK_SECRET: present("WEBHOOK_SECRET"),
    STREAM_KEY: present("STREAM_KEY"),
    STREAM_SECRET: present("STREAM_SECRET"),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
}
