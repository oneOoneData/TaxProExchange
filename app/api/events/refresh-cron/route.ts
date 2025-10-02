import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { ingestEvents } from "@/lib/normalizeEvent";
import { runValidationBatch } from "@/lib/validateEvents";
import { sendAdminEventsNotification } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Verify this is a cron request from Vercel
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const supabase = createServerClient();

    const prompt = `
You are an events researcher for US tax & accounting pros. 
Return a STRICT JSON array of upcoming events in the next 180 days from TODAY (${new Date().toISOString().split('T')[0]}). 
Each object with fields: title, description, start_date (ISO), end_date (ISO|null), location_city (string|null), location_state (2-letter or null), url, tags (array of lowercase slugs like: general_tax, s_corp, multi_state, irs_rep, software_proseries, software_drake, software_proconnect, software_lacerte, bookkeeping, sales_tax, international, crypto).
Include national conferences, IRS/CPE webinars, state society events, and major vendor roadshows.
If location is virtual, set location_city=null and location_state=null, include tag "virtual".
Return ONLY raw JSON - no markdown formatting, no code blocks, no explanations.
IMPORTANT: All events must have start_date in 2025 or 2026, not 2024.
    `.trim();

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });

    const raw = resp.choices?.[0]?.message?.content ?? "[]";
    let items: any[] = [];
    try { 
      items = JSON.parse(raw); 
    } catch { 
      console.error("Failed to parse OpenAI response:", raw);
      items = []; 
    }

    // Use new ingestion pipeline with link health validation
    const ingestResult = await ingestEvents(items, "ai_generated");
    
    // Run validation batch to check link health for new/updated events
    console.log("Running link validation batch...");
    const validationResult = await runValidationBatch(100);

    // Get admin email addresses
    const { data: admins, error: adminError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("is_admin", true)
      .not("email", "is", null);

    if (!adminError && admins && admins.length > 0) {
      // Send notification email to admins
      const emailPromises = admins.map(admin => 
        sendAdminEventsNotification({
          email: admin.email,
          adminName: admin.full_name || 'Admin',
          totalEvents: items.length,
          ingestedEvents: ingestResult.inserted,
          updatedEvents: ingestResult.updated,
          validationResults: {
            processed: validationResult.processed,
            validated: validationResult.validated,
            publishable: validationResult.publishable,
            errors: validationResult.errors
          },
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/events-review`,
          dateRange: {
            from: new Date().toLocaleDateString(),
            to: new Date(Date.now() + 180*24*60*60*1000).toLocaleDateString()
          }
        })
      );

      try {
        await Promise.all(emailPromises);
        console.log(`Sent notification emails to ${admins.length} admins`);
      } catch (emailError) {
        console.error("Error sending admin notification emails:", emailError);
        // Don't fail the cron job if email fails
      }
    }

    return NextResponse.json({ 
      success: true,
      ingestion: {
        processed: ingestResult.processed,
        inserted: ingestResult.inserted,
        updated: ingestResult.updated,
        errors: ingestResult.errors
      },
      validation: {
        processed: validationResult.processed,
        validated: validationResult.validated,
        publishable: validationResult.publishable,
        errors: validationResult.errors
      },
      notifications: {
        emailsSent: admins?.length || 0
      },
      total: items.length
    });

  } catch (error) {
    console.error("Error in cron refresh API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}