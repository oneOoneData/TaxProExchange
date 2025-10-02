/**
 * Events filtering and matching utilities for TaxProExchange
 */

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location_city?: string;
  location_state?: string;
  url: string;
  tags: string[];
  source: 'curated' | 'ai_generated';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id?: string;
  clerk_id?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Check if an event matches a user's profile based on their specialties, software, and locations
 */
export function eventMatchesProfile(
  event: { 
    location_state?: string | null; 
    tags?: string[] 
  },
  profile: Profile,
  specialties: string[],
  softwareSlugs: string[],
  states: string[]
): boolean {
  // Convert tags to lowercase for case-insensitive matching
  const tagSet = new Set((event.tags ?? []).map(t => t.toLowerCase()));
  
  // Check if event has any of the user's specialties
  const hasSpecialty = specialties.some(specialty => 
    tagSet.has(specialty.toLowerCase())
  );
  
  // Check if event mentions any of the user's software
  const hasSoftware = softwareSlugs.some(softwareSlug => 
    tagSet.has(`software_${softwareSlug.toLowerCase()}`) || 
    tagSet.has(softwareSlug.toLowerCase())
  );
  
  // Include general tax events for everyone
  const hasGeneralTax = tagSet.has("general_tax");
  
  // Include virtual events for everyone (no location restriction)
  const isVirtual = tagSet.has("virtual");
  
  // If user has no specialties or software, be more inclusive
  const hasNoPreferences = specialties.length === 0 && softwareSlugs.length === 0;
  
  // Location matching - be more flexible
  const stateOk = !event.location_state || states.includes(event.location_state);
  
  // Debug logging
  const debug = {
    eventTitle: (event as any).title,
    eventState: event.location_state,
    eventTags: event.tags,
    userStates: states,
    hasSpecialty,
    hasSoftware,
    hasGeneralTax,
    isVirtual,
    hasNoPreferences,
    stateOk
  };
  
  // Location-aware matching logic
  let matches = false;
  
  if (isVirtual) {
    // Virtual events are always relevant
    matches = true;
  } else if (stateOk) {
    // Events in user's states - show if they have relevant tags or no preferences
    matches = hasSpecialty || hasSoftware || hasGeneralTax || hasNoPreferences;
  } else if (hasNoPreferences) {
    // If user has no preferences, show general tax events anywhere
    matches = hasGeneralTax;
  }
  
  console.log("Event match debug:", { ...debug, matches });
  return matches;
}

/**
 * Filter events by date range (upcoming events only)
 */
export function filterUpcomingEvents(events: Event[], daysAhead: number = 180): Event[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  return events.filter(event => {
    const eventDate = new Date(event.start_date);
    return eventDate >= now && eventDate <= futureDate;
  });
}

/**
 * Sort events by start date (ascending)
 */
export function sortEventsByDate(events: Event[]): Event[] {
  return [...events].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
}

/**
 * Format event date for display
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
}

/**
 * Format event location for display
 */
export function formatEventLocation(event: { 
  location_city?: string | null; 
  location_state?: string | null 
}): string {
  if (!event.location_state) {
    return "Virtual / Online";
  }
  
  if (event.location_city) {
    return `${event.location_city}, ${event.location_state}`;
  }
  
  return event.location_state;
}
