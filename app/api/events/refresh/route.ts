import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { ingestEvents } from "@/lib/normalizeEvent";
import { runValidationBatch } from "@/lib/validateEvents";

export const dynamic = 'force-dynamic';

// Helper function to verify admin status
async function verifyAdminStatus(): Promise<boolean> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return false;
    }

    const supabase = createServerClient();

    // Check if user has admin role in the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .eq('is_admin', true)
      .single();

    return !error && profile?.is_admin === true;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Temporarily allow any authenticated user to refresh events for testing
  // TODO: Add proper admin check later
  // if (!isAdmin(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const supabase = createServerClient();

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is not set");
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  console.log("OpenAI API key is set, proceeding with API call...");

  // Clean up old events from 2024
  console.log("Cleaning up old 2024 events...");
  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .lt("start_date", "2025-01-01");
  
  if (deleteError) {
    console.error("Error cleaning up old events:", deleteError);
  } else {
    console.log("Old events cleaned up successfully");
  }

  const prompt = `
You are an events researcher for US tax & accounting pros. 
Return a STRICT JSON array of upcoming events in the next 180 days from TODAY (${new Date().toISOString().split('T')[0]}). 
Each object with fields: title, description, start_date (ISO), end_date (ISO|null), location_city (string|null), location_state (2-letter or null), url, tags (array of lowercase slugs like: general_tax, s_corp, multi_state, irs_rep, software_proseries, software_drake, software_proconnect, software_lacerte, bookkeeping, sales_tax, international, crypto).
Include national conferences, IRS/CPE webinars, state society events, and major vendor roadshows.
If location is virtual, set location_city=null and location_state=null, include tag "virtual".
Return ONLY raw JSON - no markdown formatting, no code blocks, no explanations.
IMPORTANT: All events must have start_date in 2025 or 2026, not 2024.
  `.trim();

  console.log("Making OpenAI API call...");
  let resp;
  try {
    resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    return NextResponse.json({ error: "OpenAI API call failed" }, { status: 500 });
  }

  const raw = resp.choices?.[0]?.message?.content ?? "[]";
  console.log("OpenAI raw response:", raw);
  
  // Strip markdown code blocks if present
  let cleanJson = raw.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  console.log("Cleaned JSON:", cleanJson);
  
  let items:any[] = [];
  try { 
    items = JSON.parse(cleanJson); 
    console.log("Parsed items count:", items.length);
  } catch (err) { 
    console.error("JSON parse error:", err);
    console.error("Cleaned JSON that failed to parse:", cleanJson);
    items = []; 
  }

  // Use new ingestion pipeline with link health validation
  const ingestResult = await ingestEvents(items, "ai_generated");
  
  // Run validation batch to check link health for new/updated events
  console.log("Running link validation batch...");
  const validationResult = await runValidationBatch(100);

  return NextResponse.json({ 
    total: items.length,
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
    }
  });
}
