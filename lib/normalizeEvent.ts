/**
 * Event normalization and ingestion pipeline for TaxProExchange
 * Handles staging events and normalization to the events table
 */

import crypto from "crypto";
import { createServerClient } from "@/lib/supabase/server";

export interface RawEvent {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location_city?: string;
  location_state?: string;
  url?: string;
  tags?: string[];
  organizer?: string;
  host?: string;
  publisher?: string;
  summary?: string;
  start?: string;
  startDate?: string;
  ends_at?: string;
  endsAt?: string;
  venue?: string;
  location?: string;
  link?: string;
  website?: string;
}

export interface NormalizedEvent {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location_city?: string;
  location_state?: string;
  candidate_url?: string;
  tags?: string[];
  organizer?: string;
  region: string;
  dedupe_key: string;
}

/**
 * Creates a deduplication key for events
 */
export function makeDedupeKey(title: string, startsAt: string, organizer?: string): string {
  const base = `${(title || "").toLowerCase()}|${startsAt}|${(organizer || "").toLowerCase()}`;
  return crypto.createHash("sha1").update(base).digest("hex");
}

/**
 * Normalizes raw event data into the events table format
 */
export function normalize(raw: RawEvent, source: string = "ai_generated"): NormalizedEvent | null {
  const title = raw.title || raw.summary || "";
  const startsAt = raw.start_date || raw.start || raw.startDate || "";
  const endsAt = raw.end_date || raw.ends_at || raw.endsAt || undefined;
  const organizer = raw.organizer || raw.host || raw.publisher || undefined;
  const region = raw.location_state || "CA"; // Default to CA
  const candidateUrl = raw.url || raw.link || raw.website || undefined;
  const location = raw.location_city || raw.location || raw.venue || undefined;

  // Validate that the event is in the future
  if (startsAt) {
    const eventDate = new Date(startsAt);
    const now = new Date();
    
    // Reject events that are more than 1 day in the past
    if (eventDate < new Date(now.getTime() - 24*60*60*1000)) {
      console.log(`Rejecting past event: ${title} on ${startsAt}`);
      return null;
    }
  }

  return {
    title: title.slice(0, 400), // Truncate to prevent DB issues
    description: raw.description ? raw.description.slice(0, 4000) : undefined,
    start_date: startsAt,
    end_date: endsAt,
    location_city: location,
    location_state: region,
    candidate_url: candidateUrl,
    tags: raw.tags || [],
    organizer,
    region,
    dedupe_key: makeDedupeKey(title, startsAt, organizer)
  };
}

/**
 * Stages raw event data for later processing
 */
export async function stageRawEvent(rawData: any, source: string): Promise<{
  success: boolean;
  stagingId?: string;
  error?: string;
}> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from("staging_events")
      .insert({
        source,
        raw: rawData,
        dedupe_key: makeDedupeKey(
          rawData.title || rawData.summary || "",
          rawData.start_date || rawData.start || rawData.startDate || "",
          rawData.organizer || rawData.host || rawData.publisher
        )
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error staging raw event:", error);
      return { success: false, error: error.message };
    }

    return { success: true, stagingId: data.id };
  } catch (error) {
    console.error("Error in stageRawEvent:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Processes staged events and upserts them into the events table
 */
export async function processStagedEvents(batchSize: number = 50): Promise<{
  processed: number;
  inserted: number;
  updated: number;
  errors: number;
}> {
  const supabase = createServerClient();
  
  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  try {
    // Get staged events that haven't been processed
    const { data: stagedEvents, error: fetchError } = await supabase
      .from("staging_events")
      .select("*")
      .limit(batchSize)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching staged events:", fetchError);
      throw fetchError;
    }

    if (!stagedEvents || stagedEvents.length === 0) {
      console.log("No staged events to process");
      return { processed: 0, inserted: 0, updated: 0, errors: 0 };
    }

    console.log(`Processing ${stagedEvents.length} staged events`);

    for (const staged of stagedEvents) {
      processed++;

      try {
        // Normalize the raw data
        const normalized = normalize(staged.raw, staged.source);

        // Skip if normalization failed (e.g., past event)
        if (!normalized) {
          console.log(`Skipping invalid event: ${staged.raw.title || 'Unknown'}`);
          continue;
        }

        // Check if event already exists
        const { data: existing, error: checkError } = await supabase
          .from("events")
          .select("id")
          .eq("dedupe_key", normalized.dedupe_key)
          .single();

        if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows returned
          console.error("Error checking existing event:", checkError);
          errors++;
          continue;
        }

        // Prepare event data for upsert
        const eventData = {
          title: normalized.title,
          description: normalized.description,
          start_date: normalized.start_date,
          end_date: normalized.end_date,
          location_city: normalized.location_city,
          location_state: normalized.location_state,
          url: normalized.candidate_url || "", // Keep for backward compatibility
          candidate_url: normalized.candidate_url,
          tags: normalized.tags,
          organizer: normalized.organizer,
          region: normalized.region,
          dedupe_key: normalized.dedupe_key,
          source: staged.source,
          // Link health fields start as unvalidated
          canonical_url: null,
          url_status: null,
          redirect_chain: [],
          link_health_score: 0,
          last_checked_at: null,
          publishable: false,
          // Review status - all new events need human review
          review_status: 'pending_review'
        };

        let result;
        if (existing) {
          // Update existing event
          result = await supabase
            .from("events")
            .update(eventData)
            .eq("id", existing.id);
          
          if (!result.error) {
            updated++;
            console.log(`Updated existing event: ${normalized.title}`);
          }
        } else {
          // Insert new event
          result = await supabase
            .from("events")
            .insert(eventData);
          
          if (!result.error) {
            inserted++;
            console.log(`Inserted new event: ${normalized.title}`);
          }
        }

        if (result.error) {
          console.error("Error upserting event:", result.error);
          errors++;
        }

        // Delete the staged event after successful processing
        await supabase
          .from("staging_events")
          .delete()
          .eq("id", staged.id);

      } catch (error) {
        console.error(`Error processing staged event ${staged.id}:`, error);
        errors++;
      }
    }

    console.log(`Staged events processing complete: ${processed} processed, ${inserted} inserted, ${updated} updated, ${errors} errors`);

    return { processed, inserted, updated, errors };

  } catch (error) {
    console.error("Error in processStagedEvents:", error);
    throw error;
  }
}

/**
 * Ingests events directly (for immediate processing)
 */
export async function ingestEvents(rawEvents: RawEvent[], source: string = "ai_generated"): Promise<{
  processed: number;
  inserted: number;
  updated: number;
  errors: number;
}> {
  const supabase = createServerClient();
  
  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  console.log(`Ingesting ${rawEvents.length} events from source: ${source}`);

  for (const raw of rawEvents) {
    processed++;

    try {
      // Normalize the event
      const normalized = normalize(raw, source);

      // Check if event already exists
      const { data: existing, error: checkError } = await supabase
        .from("events")
        .select("id")
        .eq("dedupe_key", normalized.dedupe_key)
        .single();

      if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows returned
        console.error("Error checking existing event:", checkError);
        errors++;
        continue;
      }

      // Prepare event data
      const eventData = {
        title: normalized.title,
        description: normalized.description,
        start_date: normalized.start_date,
        end_date: normalized.end_date,
        location_city: normalized.location_city,
        location_state: normalized.location_state,
        url: normalized.candidate_url || "", // Keep for backward compatibility
        candidate_url: normalized.candidate_url,
        tags: normalized.tags,
        organizer: normalized.organizer,
        region: normalized.region,
        dedupe_key: normalized.dedupe_key,
        source,
        // Link health fields start as unvalidated
        canonical_url: null,
        url_status: null,
        redirect_chain: [],
        link_health_score: 0,
        last_checked_at: null,
        publishable: false,
        // Review status for human-in-the-loop
        review_status: 'pending_review'
      };

      let result;
      if (existing) {
        // Update existing event
        result = await supabase
          .from("events")
          .update(eventData)
          .eq("id", existing.id);
        
        if (!result.error) {
          updated++;
        }
      } else {
        // Insert new event
        result = await supabase
          .from("events")
          .insert(eventData);
        
        if (!result.error) {
          inserted++;
        }
      }

      if (result.error) {
        console.error("Error upserting event:", result.error);
        errors++;
      }

    } catch (error) {
      console.error(`Error processing event:`, error);
      errors++;
    }
  }

  console.log(`Event ingestion complete: ${processed} processed, ${inserted} inserted, ${updated} updated, ${errors} errors`);

  return { processed, inserted, updated, errors };
}
