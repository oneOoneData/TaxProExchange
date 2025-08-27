import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const present = (k: string) => Boolean(process.env[k]?.length);
  return NextResponse.json({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: present("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    CLERK_SECRET_KEY: present("CLERK_SECRET_KEY"),
    CLERK_SIGN_IN_URL: present("CLERK_SIGN_IN_URL"),
    CLERK_SIGN_UP_URL: present("CLERK_SIGN_UP_URL"),
    SUPABASE_URL: present("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: present("SUPABASE_SERVICE_ROLE_KEY"),
  });
}
