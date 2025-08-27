import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";
import { supabaseService } from "@/lib/supabaseService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const secret = process.env.CLERK_WEBHOOK_SECRET!;
    
    if (!secret) {
      console.error('CLERK_WEBHOOK_SECRET is not set');
      return NextResponse.json({ ok: false, error: "Webhook secret not configured" }, { status: 500 });
    }

    const wh = new Webhook(secret);
    const headersList = await headers();

    let evt: any;
    try {
      evt = wh.verify(payload, {
        "svix-id": headersList.get("svix-id")!,
        "svix-timestamp": headersList.get("svix-timestamp")!,
        "svix-signature": headersList.get("svix-signature")!,
      } as WebhookRequiredHeaders);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    console.log('Webhook event received:', evt.type, evt.data.id);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const u = evt.data;
      const supabase = supabaseService();
      
      // Extract email from the correct path in the data structure
      const email = u.primary_email_address_id ? 
        u.email_addresses?.find((e: any) => e.id === u.primary_email_address_id)?.email_address : 
        u.email_addresses?.[0]?.email_address ?? null;

      console.log('Processing user:', u.id, 'Email:', email);

      const { error } = await supabase
        .from("profiles")
        .upsert({
          clerk_id: u.id,
          email,
          first_name: u.first_name ?? null,
          last_name: u.last_name ?? null,
          image_url: u.image_url ?? null,
        }, { onConflict: "clerk_id" });
        
      if (error) {
        console.error('Supabase upsert error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      
      console.log('Profile upserted successfully for user:', u.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
}
