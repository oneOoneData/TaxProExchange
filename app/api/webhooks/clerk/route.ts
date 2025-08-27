import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";
import { supabaseService } from "@/lib/supabaseService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const payload = await req.text();
  const secret = process.env.CLERK_WEBHOOK_SECRET!;
  const wh = new Webhook(secret);

  let evt: any;
  try {
    evt = wh.verify(payload, {
      "svix-id": headers().get("svix-id")!,
      "svix-timestamp": headers().get("svix-timestamp")!,
      "svix-signature": headers().get("svix-signature")!,
    } as WebhookRequiredHeaders);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const u = evt.data;
    const supabase = supabaseService();
    const email = u.email_addresses?.[0]?.email_address ?? null;
    const { error } = await supabase
      .from("profiles")
      .upsert({
        clerk_id: u.id,
        email,
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        image_url: u.image_url ?? null,
      }, { onConflict: "clerk_id" });
    if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
