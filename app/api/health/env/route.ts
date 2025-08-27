import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const present = (k: string) => Boolean(process.env[k]?.length);
  return NextResponse.json({
    NEXTAUTH_URL: present("NEXTAUTH_URL"),
    NEXTAUTH_SECRET: present("NEXTAUTH_SECRET"),
    GOOGLE_CLIENT_ID: present("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: present("GOOGLE_CLIENT_SECRET"),
    SUPABASE_URL: present("SUPABASE_URL"),
    SUPABASE_ANON_KEY: present("SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: present("SUPABASE_SERVICE_ROLE_KEY"),
  });
}
