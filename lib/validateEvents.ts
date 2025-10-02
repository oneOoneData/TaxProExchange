/**
 * Event validation worker for TaxProExchange
 * Validates event URLs, updates link health scores, and manages publishable status
 */

import { createServerClient } from "@/lib/supabase/server";
import { checkUrl, healUrl, shouldTombstone, extractUrlParts } from "@/lib/linkChecker";

const SCORE_MIN = 50; // Production threshold (was 30 for testing)
const RECENT_CHECK_HOURS = 24; // Back to normal 24-hour validation interval

interface EventToValidate {
  id: string;
  title: string;
  organizer?: string;
  candidate_url?: string;
  canonical_url?: string;
  last_checked_at?: string;
  link_health_score?: number;
}

function buildKeywords(title?: string, organizer?: string): string[] {
  const keywords: string[] = [];
  if (title) {
    // Extract meaningful words from title
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5); // Limit to most important words
    keywords.push(...words);
  }
  if (organizer) {
    const orgWords = organizer.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    keywords.push(...orgWords);
  }
  return keywords;
}

function needsValidation(event: EventToValidate): boolean {
  // Always validate if never checked
  if (!event.last_checked_at) return true;
  
  // Check if last validation was more than 24 hours ago
  const lastChecked = new Date(event.last_checked_at);
  const hoursSinceCheck = (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceCheck >= RECENT_CHECK_HOURS;
}

export async function runValidationBatch(limit = 100): Promise<{
  processed: number;
  validated: number;
  publishable: number;
  errors: number;
}> {
  const supabase = createServerClient();
  
  let processed = 0;
  let validated = 0;
  let publishable = 0;
  let errors = 0;

  try {
    // Get events that need validation (ordered by last_checked_at, nulls first)
    const { data: events, error: fetchError } = await supabase
      .from("events")
      .select("id,title,organizer,candidate_url,canonical_url,last_checked_at,link_health_score")
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .limit(limit);

    if (fetchError) {
      console.error("Error fetching events for validation:", fetchError);
      throw fetchError;
    }

    if (!events || events.length === 0) {
      console.log("No events found for validation");
      return { processed: 0, validated: 0, publishable: 0, errors: 0 };
    }

    console.log(`Starting validation batch for ${events.length} events`);

    for (const event of events) {
      processed++;
      
      try {
        const url = event.canonical_url || event.candidate_url;
        if (!url) {
          console.warn(`Event ${event.id} has no URL to validate`);
          continue;
        }

        // Skip if recently validated (unless forced)
        if (!needsValidation(event)) {
          console.log(`Skipping recently validated event: ${event.id}`);
          continue;
        }

        console.log(`Validating event: ${event.title} (${url})`);

        // Check if this URL is tombstoned
        const urlParts = extractUrlParts(url);
        if (urlParts) {
          const { data: tombstone } = await supabase
            .from("event_url_tombstones")
            .select("id")
            .eq("domain", urlParts.domain)
            .eq("path", urlParts.path)
            .single();

          if (tombstone) {
            console.log(`URL is tombstoned, skipping: ${url}`);
            await supabase
              .from("events")
              .update({
                url_status: 404,
                link_health_score: 0,
                last_checked_at: new Date().toISOString(),
                publishable: false
              })
              .eq("id", event.id);
            continue;
          }
        }

        // Validate the URL
        const keywords = buildKeywords(event.title, event.organizer);
        const result = await checkUrl(url, keywords);

        // If 404/410, try healing the URL
        let finalUrl = result.canonical || result.finalUrl;
        if (result.status === 404 || result.status === 410) {
          const healedUrl = healUrl(url);
          if (healedUrl !== url) {
            console.log(`Attempting to heal URL: ${url} -> ${healedUrl}`);
            const healedResult = await checkUrl(healedUrl, keywords);
            if (healedResult.score > result.score) {
              console.log(`Healed URL improved score: ${result.score} -> ${healedResult.score}`);
              Object.assign(result, healedResult);
              finalUrl = healedResult.canonical || healedResult.finalUrl;
            }
          }
        }

        // Check if we should tombstone this URL
        if (shouldTombstone(result.status, result.redirectChain, result.score) && urlParts) {
          await supabase
            .from("event_url_tombstones")
            .insert({
              domain: urlParts.domain,
              path: urlParts.path,
              reason: `Status: ${result.status}, Score: ${result.score}`
            });
          console.log(`Tombstoned URL: ${url}`);
        }

        // Determine if event should be publishable
        const isPublishable = result.score >= SCORE_MIN && result.status < 400;

        // Update the event
        const updateData = {
          canonical_url: result.canonical || finalUrl,
          url_status: result.status,
          redirect_chain: result.redirectChain,
          link_health_score: result.score,
          last_checked_at: new Date().toISOString(),
          publishable: isPublishable
        };

        const { error: updateError } = await supabase
          .from("events")
          .update(updateData)
          .eq("id", event.id);

        if (updateError) {
          console.error(`Error updating event ${event.id}:`, updateError);
          errors++;
        } else {
          validated++;
          if (isPublishable) {
            publishable++;
          }
          console.log(`Event ${event.id} validated: score=${result.score}, publishable=${isPublishable}`);
        }

        // Small delay to avoid overwhelming external servers
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error validating event ${event.id}:`, error);
        errors++;
      }
    }

    console.log(`Validation batch complete: ${processed} processed, ${validated} validated, ${publishable} publishable, ${errors} errors`);

    return { processed, validated, publishable, errors };

  } catch (error) {
    console.error("Error in validation batch:", error);
    throw error;
  }
}

/**
 * Validates a specific event by ID
 */
export async function validateEventById(eventId: string): Promise<{
  success: boolean;
  score?: number;
  publishable?: boolean;
  error?: string;
}> {
  const supabase = createServerClient();

  try {
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("id,title,organizer,candidate_url,canonical_url")
      .eq("id", eventId)
      .single();

    if (fetchError || !event) {
      return { success: false, error: "Event not found" };
    }

    const url = event.canonical_url || event.candidate_url;
    if (!url) {
      return { success: false, error: "Event has no URL to validate" };
    }

    const keywords = buildKeywords(event.title, event.organizer);
    const result = await checkUrl(url, keywords);

    const isPublishable = result.score >= SCORE_MIN && result.status < 400;

    const updateData = {
      canonical_url: result.canonical || result.finalUrl,
      url_status: result.status,
      redirect_chain: result.redirectChain,
      link_health_score: result.score,
      last_checked_at: new Date().toISOString(),
      publishable: isPublishable
    };

    const { error: updateError } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { 
      success: true, 
      score: result.score, 
      publishable: isPublishable 
    };

  } catch (error) {
    console.error("Error validating event:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
