import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const present = (k: string) => Boolean(process.env[k]?.length);
  const getValue = (k: string) => process.env[k] || 'NOT_SET';
  
  return NextResponse.json({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: present("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    CLERK_SECRET_KEY: present("CLERK_SECRET_KEY"),
    CLERK_SIGN_IN_URL: present("CLERK_SIGN_IN_URL"),
    CLERK_SIGN_UP_URL: present("CLERK_SIGN_UP_URL"),
    SUPABASE_URL: present("SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_URL: present("NEXT_PUBLIC_SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: present("SUPABASE_SERVICE_ROLE_KEY"),
    SUPABASE_ANON_KEY: present("SUPABASE_ANON_KEY"),
    // Show actual values for debugging (be careful with sensitive data)
    SUPABASE_URL_VALUE: getValue("SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_URL_VALUE: getValue("NEXT_PUBLIC_SUPABASE_URL"),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  });
}
