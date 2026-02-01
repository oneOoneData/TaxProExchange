import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// US State names mapping for normalization
const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

// Parse primary_location from JSON object
// Since data is now normalized, this is much simpler - no need to handle strings
function parseLocation(raw: any): { state?: string | null; country?: string | null } | null {
  if (!raw) return null;
  
  // Data is now normalized, so it should always be an object
  // But handle edge cases for safety
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  // Data is normalized with lowercase keys
  const locationData = raw as Record<string, unknown>;
  
  return {
    state: typeof locationData.state === 'string' ? locationData.state : null,
    country: typeof locationData.country === 'string' ? locationData.country : null,
  };
}

// Normalize state to 2-letter code (e.g., "Florida" -> "FL", "FL" -> "FL")
function normalizeState(value: string | null | undefined): string | null {
  if (!value) return null;
  let state = value.trim();
  if (!state) return null;
  
  // Handle comma-separated values (take first)
  if (state.includes(',')) {
    state = state.split(',')[0].trim();
  }
  
  const upper = state.toUpperCase();
  
  // If it's already a 2-letter code, return it
  if (US_STATE_NAMES[upper]) {
    return upper;
  }
  
  // Try to find by full name
  const match = Object.entries(US_STATE_NAMES).find(
    ([, name]) => name.toUpperCase() === upper
  );
  
  return match ? match[0] : null;
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const credential_type = searchParams.get('credential_type') || '';
    // Handle multiple specializations - get all values for this parameter
    const specializations = searchParams.getAll('specialization');
    const software = searchParams.get('software') || '';
    // Normalize state filter to uppercase 2-letter code
    const stateParam = searchParams.get('state') || '';
    const state = stateParam ? normalizeState(stateParam) || stateParam.toUpperCase().trim() : '';
    const accepting_work = searchParams.get('accepting_work') || '';
    const verified_only = searchParams.get('verified_only') || 'false';
    console.log('🔍 Verified only parameter:', verified_only, 'type:', typeof verified_only);
    const years_experience = searchParams.get('years_experience') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build the base query with proper joins
    let supabaseQuery = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        headline,
        bio,
        credential_type,
        firm_name,
        slug,
        accepting_work,
        visibility_state,
        is_listed,
        works_multistate,
        works_international,
        countries,
        primary_location,
        states,
        years_experience,
        software,
        created_at,
        profile_type
`, { count: 'exact' })
      .eq('is_listed', true); // Show all profiles where is_listed = true (user controls this)

    // Apply verified filter based on user preference
    if (verified_only === 'true') {
      supabaseQuery = supabaseQuery.eq('visibility_state', 'verified');
      console.log('🔍 Verified filter applied: visibility_state = verified');
    } else {
      console.log('🔍 No verified filter applied - showing all profiles');
    }
    
    // Debug: Log the final query being executed
    console.log('🔍 Final Supabase query conditions:', {
      is_listed: true,
      visibility_state: verified_only === 'true' ? 'verified' : 'any',
      state_filter: state || 'none'
    });
    
    // Debug: Log the final query being executed
    console.log('🔍 Final Supabase query conditions:', {
      is_listed: true,
      visibility_state: verified_only === 'true' ? 'verified' : 'any',
      state_filter: state || 'none',
      page: page,
      limit: limit,
      offset: (page - 1) * limit
    });
    // When verified_only is false, show all profiles (both verified and unverified)
    // Users can still only view verified profiles due to profile API restrictions

    // Apply text search for names, firm names, headlines, bios, and software
    if (query) {
      const searchTerm = `%${query}%`;
      console.log('🔍 Applying text search with term:', searchTerm);
      
      // First, get profiles that match basic fields
      const basicSearchQuery = supabaseQuery.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},headline.ilike.${searchTerm},bio.ilike.${searchTerm},firm_name.ilike.${searchTerm}`);
      
      // Map software search terms to slugs for database lookup
      const softwareOptions = [
        // Consumer tax prep
        { slug: 'turbotax', label: 'TurboTax' },
        { slug: 'hr_block', label: 'H&R Block Online' },
        { slug: 'taxact', label: 'TaxAct' },
        { slug: 'taxslayer', label: 'TaxSlayer' },
        { slug: 'freetaxusa', label: 'FreeTaxUSA' },
        { slug: 'cash_app_taxes', label: 'Cash App Taxes' },
        
        // Professional preparer suites
        { slug: 'lacerte', label: 'Intuit Lacerte' },
        { slug: 'proseries', label: 'Intuit ProSeries' },
        { slug: 'proconnect', label: 'Intuit ProConnect' },
        { slug: 'drake', label: 'Drake Tax' },
        { slug: 'ultratax', label: 'Thomson Reuters UltraTax CS' },
        { slug: 'cch_axcess', label: 'CCH Axcess Tax' },
        { slug: 'axcess', label: 'Axcess' },
        { slug: 'cch_prosystem', label: 'CCH ProSystem fx Tax' },
        { slug: 'prosystemfx', label: 'ProSystemFX' },
        { slug: 'atx', label: 'ATX' },
        { slug: 'taxwise', label: 'TaxWise' },
        { slug: 'canopy', label: 'Canopy' },
        { slug: 'taxdome', label: 'TaxDome' },
        
        // Other tax prep software
        { slug: 'gosystem_taxrs', label: 'GoSystemTaxRS' },
        { slug: 'mytaxprepoffice', label: 'MyTaxPrepOffice' },
        { slug: 'crosslink', label: 'CrossLink' },
        { slug: 'wg', label: 'WG' },
        
        // Corporate & enterprise
        { slug: 'corptax', label: 'CSC Corptax' },
        { slug: 'onesource', label: 'Thomson Reuters ONESOURCE' },
        { slug: 'planner', label: 'Thomson Reuters Planner' },
        { slug: 'longview', label: 'Wolters Kluwer Longview Tax' },
        { slug: 'oracle_tax', label: 'Oracle Tax Reporting Cloud' },
        
        // Indirect tax & sales tax
        { slug: 'avalara', label: 'Avalara' },
        { slug: 'vertex', label: 'Vertex (O Series)' },
        { slug: 'sovos', label: 'Sovos' },
        { slug: 'taxjar', label: 'TaxJar' },
        { slug: 'stripe_tax', label: 'Stripe Tax' },
        
        // Accounting & bookkeeping
        { slug: 'quickbooks_online', label: 'QuickBooks Online' },
        { slug: 'xero', label: 'Xero' },
        { slug: 'freshbooks', label: 'FreshBooks' },
        { slug: 'sage', label: 'Sage' },
        { slug: 'wave', label: 'Wave' },
        
        // Payroll & employer
        { slug: 'adp', label: 'ADP' },
        { slug: 'paychex', label: 'Paychex' },
        { slug: 'gusto', label: 'Gusto' },
        { slug: 'quickbooks_payroll', label: 'QuickBooks Payroll' },
        { slug: 'rippling', label: 'Rippling' },
        
        // Information returns
        { slug: 'track1099', label: 'Track1099' },
        { slug: 'tax1099', label: 'Tax1099 (Zenwork)' },
        { slug: 'yearli', label: 'Yearli (Greatland)' },
        { slug: 'efile4biz', label: 'efile4Biz' },
        
        // Crypto tax
        { slug: 'cointracker', label: 'CoinTracker' },
        { slug: 'koinly', label: 'Koinly' },
        { slug: 'coinledger', label: 'CoinLedger' },
        { slug: 'taxbit', label: 'TaxBit' },
        { slug: 'zenledger', label: 'ZenLedger' },
        
        // Fixed assets & depreciation
        { slug: 'bloomberg_fixed_assets', label: 'Bloomberg Tax Fixed Assets' },
        { slug: 'sage_fixed_assets', label: 'Sage Fixed Assets' },
        { slug: 'cch_fixed_assets', label: 'CCH ProSystem fx Fixed Assets' },
        
        // Tax research & content
        { slug: 'checkpoint', label: 'Thomson Reuters Checkpoint' },
        { slug: 'cch_intelliconnect', label: 'CCH IntelliConnect' },
        { slug: 'bloomberg_tax', label: 'Bloomberg Tax & Accounting' },
        { slug: 'lexisnexis_tax', label: 'LexisNexis Tax' },
        { slug: 'taxnotes', label: 'TaxNotes' },
        
        // Workpapers & engagement
        { slug: 'caseware', label: 'CaseWare Working Papers' },
        { slug: 'workiva', label: 'Workiva' },
        { slug: 'sureprep', label: 'SurePrep' },
        { slug: 'cch_workstream', label: 'CCH Axcess Workstream' },
        
        // Practice management & workflow
        { slug: 'truss', label: 'Truss' }
      ];
      
      // Find matching software slugs based on the search query
      const normalizedQuery = query.toLowerCase().trim();
      const matchingSlugs = softwareOptions
        .filter(option => 
          option.label.toLowerCase().includes(normalizedQuery) ||
          option.slug.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery.includes(option.label.toLowerCase()) ||
          normalizedQuery.includes(option.slug.toLowerCase())
        )
        .map(option => option.slug);
      
      console.log('🔍 Software search debug:', {
        query: query,
        matchingSlugs: matchingSlugs,
        softwareOptionsCount: softwareOptions.length
      });
      
      let profileIdsFromSoftware: string[] = [];
      if (matchingSlugs.length > 0) {
        console.log('🔍 Searching for profiles with software slugs:', matchingSlugs);
        const { data: matchingSoftware } = await supabase
          .from('profile_software')
          .select('profile_id')
          .in('software_slug', matchingSlugs);
        
        console.log('🔍 Software query result:', { matchingSoftware, count: matchingSoftware?.length || 0 });
        
        if (matchingSoftware && matchingSoftware.length > 0) {
          profileIdsFromSoftware = matchingSoftware.map(ps => ps.profile_id);
          console.log('🔍 Found profile IDs from software:', profileIdsFromSoftware);
        }
      } else {
        console.log('🔍 No matching software slugs found for query:', query);
      }
      
      // If we found profiles with matching software, combine the results
      if (profileIdsFromSoftware.length > 0) {
        supabaseQuery = basicSearchQuery.or(`id.in.(${profileIdsFromSoftware.join(',')})`);
      } else {
        supabaseQuery = basicSearchQuery;
      }
    }

    // Apply credential type filter
    if (credential_type) {
      supabaseQuery = supabaseQuery.eq('credential_type', credential_type);
    }

    // Apply accepting work filter
    if (accepting_work === 'true') {
      supabaseQuery = supabaseQuery.eq('accepting_work', true);
    }

    // Apply years of experience filter
    if (years_experience) {
      supabaseQuery = supabaseQuery.eq('years_experience', years_experience);
    }

    // Apply software filter if specified - use profile_software table
    if (software) {
      const { data: profileSoftware } = await supabase
        .from('profile_software')
        .select('profile_id')
        .eq('software_slug', software);
      
      if (profileSoftware && profileSoftware.length > 0) {
        const profileIds = profileSoftware.map(ps => ps.profile_id);
        supabaseQuery = supabaseQuery.in('id', profileIds);
      } else {
        // No profiles with this software, return empty result
        return NextResponse.json({
          profiles: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
    }

    // Apply specialization filter if specified - handle multiple specializations
    if (specializations && specializations.length > 0) {
      // Get profiles that have any of the selected specializations
      const { data: profileSpecs } = await supabase
        .from('profile_specializations')
        .select('profile_id')
        .in('specialization_slug', specializations);
      
      if (profileSpecs && profileSpecs.length > 0) {
        const profileIds = profileSpecs.map(ps => ps.profile_id);
        supabaseQuery = supabaseQuery.in('id', profileIds);
      } else {
        // No profiles with these specializations, return empty result
        return NextResponse.json({
          profiles: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
    }

    // State filtering is handled after the main query due to complex location logic

    // Apply international filter if specified
    const international = searchParams.get('international') || '';
    if (international === 'true') {
      supabaseQuery = supabaseQuery.eq('works_international', true);
    }

    // Apply country filter if specified
    const country = searchParams.get('country') || '';
    if (country) {
      supabaseQuery = supabaseQuery.eq('works_international', true);
      // Note: Country filtering within the countries array would need a more complex query
    }

    // IMPORTANT: If filtering by state, we need to fetch a larger set of profiles first
    // then filter by location, then paginate. Since data is now normalized, the filtering
    // will be reliable, but we still need to fetch enough profiles to find matches.
    const shouldFilterByLocation = !!state;
    const fetchLimit = shouldFilterByLocation ? 1000 : limit; // Fetch more if we need to filter by location
    const fetchOffset = shouldFilterByLocation ? 0 : offset;

    console.log('🔍 Location filtering setup:', {
      state: state,
      shouldFilterByLocation: shouldFilterByLocation,
      fetchLimit: fetchLimit,
      fetchOffset: fetchOffset,
      originalLimit: limit,
      originalOffset: offset
    });

    // Get total count first (before location filtering)
    const { count: totalCountBeforeLocationFilter } = await supabaseQuery;

    // Execute the query - fetch larger set if filtering by location, otherwise use normal pagination
    // Order by verified status first, then by created_at
    console.log('🔍 Executing query with range:', { fetchOffset, fetchLimit, range: `${fetchOffset} to ${fetchOffset + fetchLimit - 1}` });
    
    // When filtering by location, use limit() instead of range() to fetch all matching profiles
    // (similar to how directory page does it). Otherwise use range() for normal pagination.
    let profilesQuery = supabaseQuery
      .order('visibility_state', { ascending: false }) // 'verified' comes before 'pending_verification'
      .order('created_at', { ascending: false });
    
    if (shouldFilterByLocation) {
      // Use limit() to fetch up to fetchLimit profiles (no offset needed, we'll filter then paginate)
      profilesQuery = profilesQuery.limit(fetchLimit);
      console.log('🔍 Using limit() to fetch', fetchLimit, 'profiles for location filtering');
    } else {
      // Use range() for normal pagination
      profilesQuery = profilesQuery.range(fetchOffset, fetchOffset + fetchLimit - 1);
      console.log('🔍 Using range() for pagination:', { fetchOffset, fetchLimit });
    }
    
    const { data: profiles, error } = await profilesQuery;
    
    console.log('🔍 Query executed, profiles fetched:', profiles?.length || 0);
    console.log('🔍 Expected fetch limit was:', fetchLimit, 'but got:', profiles?.length || 0);
    
    // Check if we have any AL profiles in the fetched set
    if (state && profiles && profiles.length > 0) {
      const alProfiles = profiles.filter(p => {
        const loc = parseLocation(p.primary_location);
        if (loc && loc.state) {
          const normalized = normalizeState(loc.state);
          return normalized === state || loc.state.toUpperCase().trim() === state;
        }
        return false;
      });
      console.log('🔍 AL profiles found in fetched set:', alProfiles.length);
      if (alProfiles.length > 0) {
        console.log('🔍 First AL profile:', {
          name: `${alProfiles[0].first_name} ${alProfiles[0].last_name}`,
          primary_location: alProfiles[0].primary_location
        });
      }
    }

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Failed to search profiles' },
        { status: 500 }
      );
    }

    console.log('🔍 Search API - Raw profiles found:', profiles?.length || 0);
    console.log('🔍 Search parameters:', { query, credential_type, specializations, software, state, stateParam, accepting_work, verified_only, years_experience });
    console.log('🔍 State filter details:', { 
      stateParam: stateParam, 
      normalizedState: state,
      stateType: typeof state,
      stateLength: state?.length 
    });
    
    // Debug: Check if Alvin Choy is in the main query results
    if (profiles && profiles.length > 0) {
      const alvinChoy = profiles.find(p => p.first_name === 'Alvin' && p.last_name === 'Choy');
      if (alvinChoy) {
        console.log('🔍 Alvin Choy found in main query results:', {
          name: `${alvinChoy.first_name} ${alvinChoy.last_name}`,
          visibility_state: alvinChoy.visibility_state,
          is_listed: alvinChoy.is_listed,
          primary_location: alvinChoy.primary_location
        });
      } else {
        console.log('🔍 Alvin Choy NOT found in main query results');
      }
    } else {
      console.log('🔍 No profiles found in main query results');
    }
    
    if (profiles && profiles.length > 0) {
      console.log('🔍 First profile sample:', {
        id: profiles[0].id,
        name: `${profiles[0].first_name} ${profiles[0].last_name}`,
        slug: profiles[0].slug,
        visibility_state: profiles[0].visibility_state,
        is_listed: profiles[0].is_listed,
        primary_location: profiles[0].primary_location
      });
      
      // Log all profiles and their verification status
      profiles.forEach((profile, index) => {
        console.log(`🔍 Profile ${index + 1}:`, {
          name: `${profile.first_name} ${profile.last_name}`,
          visibility_state: profile.visibility_state,
          is_listed: profile.is_listed,
          primary_location: profile.primary_location,
          state: state,
          verified_only: verified_only
        });
      });
    } else {
      console.log('🔍 No profiles found after database query');
    }

    // Apply remaining filters that can't be done in SQL
    let filteredProfiles = profiles || [];
    let totalAfterLocationFilter = totalCountBeforeLocationFilter || 0; // Track total after location filtering

    // Filter by professional's location if specified
    if (state) {
      console.log('🔍 Filtering by professional location. State filter:', state, 'Type:', typeof state);
      console.log('🔍 Total profiles before location filter:', filteredProfiles.length);
      
      // Log sample of primary_location data to debug
      if (filteredProfiles.length > 0) {
        console.log('🔍 Sample primary_location data from first 3 profiles:', 
          filteredProfiles.slice(0, 3).map(p => ({
            name: `${p.first_name} ${p.last_name}`,
            primary_location: p.primary_location,
            primary_location_type: typeof p.primary_location,
            parsed: parseLocation(p.primary_location)
          }))
        );
      }
      
      // Filter by primary_location state ONLY (where the professional is physically located)
      // Do NOT check profile_locations table - that's for service areas and includes remote workers
      // When filtering by state, users want to find professionals PHYSICALLY LOCATED in that state,
      // not remote workers who can service that state
      filteredProfiles = filteredProfiles.filter(p => {
        // Only check primary_location (where they're physically located)
        const location = parseLocation(p.primary_location);
        if (location && location.state) {
          const normalizedState = normalizeState(location.state);
          // Check normalized state first, then direct uppercase comparison as fallback
          if (normalizedState === state || location.state.toUpperCase().trim() === state) {
            console.log('🔍 Profile', p.first_name, p.last_name, 'matched via primary_location:', {
              rawLocation: p.primary_location,
              parsedState: location.state,
              normalizedState: normalizedState,
              directMatch: location.state.toUpperCase().trim() === state,
              filterState: state
            });
            return true;
          }
        }
        
        // Do NOT check profile_locations - that includes remote workers' service areas
        // Do NOT check states array - it's too broad and includes remote workers
        
        // Only log first few non-matches to avoid spam
        if (filteredProfiles.indexOf(p) < 3) {
          console.log('🔍 Profile', p.first_name, p.last_name, 'did not match (no primary_location state or state mismatch):', {
            rawLocation: p.primary_location,
            parsedState: location?.state,
            normalizedState: location?.state ? normalizeState(location.state) : null,
            directMatch: location?.state ? location.state.toUpperCase().trim() === state : false,
            filterState: state,
            filterStateType: typeof state
          });
        }
        
        return false;
      });
      
      console.log('🔍 Filtered profiles count by location:', filteredProfiles.length);
      if (filteredProfiles.length === 0) {
        console.log('🔍 WARNING: No profiles matched state filter', state);
        console.log('🔍 Total profiles checked:', profiles?.length || 0);
        console.log('🔍 Sample of profiles that were checked:', profiles?.slice(0, 5).map(p => {
          const loc = parseLocation(p.primary_location);
          return {
            name: `${p.first_name} ${p.last_name}`,
            primary_location: p.primary_location,
            parsedState: loc?.state,
            normalizedState: loc?.state ? normalizeState(loc.state) : null
          };
        }));
        
        // Check if any profiles have the state we're looking for (for debugging)
        const profilesWithMatchingState = profiles?.filter(p => {
          const loc = parseLocation(p.primary_location);
          if (loc && loc.state) {
            const normalized = normalizeState(loc.state);
            return normalized === state || loc.state.toUpperCase().trim() === state;
          }
          return false;
        });
        console.log('🔍 Profiles that SHOULD match (for debugging):', profilesWithMatchingState?.length || 0);
        if (profilesWithMatchingState && profilesWithMatchingState.length > 0) {
          console.log('🔍 First matching profile:', {
            name: `${profilesWithMatchingState[0].first_name} ${profilesWithMatchingState[0].last_name}`,
            primary_location: profilesWithMatchingState[0].primary_location
          });
        }
      }
      
      // Apply pagination AFTER location filtering since we fetched a larger set
      totalAfterLocationFilter = filteredProfiles.length;
      const paginatedProfiles = filteredProfiles.slice(offset, offset + limit);
      filteredProfiles = paginatedProfiles;
      
      console.log('🔍 Applied pagination after location filter:', {
        totalAfterLocationFilter,
        offset,
        limit,
        paginatedCount: filteredProfiles.length
      });
    }

    // Filter by specific country if specified
    if (country) {
      filteredProfiles = filteredProfiles.filter(p => 
        p.works_international && p.countries && p.countries.includes(country)
      );
    }

    // Software filtering is now handled in the SQL query above for better performance

    // Fetch specializations, locations, software, and licenses in batches to reduce query volume
    const profileIds = filteredProfiles.map(profile => profile.id);
    const specializationsByProfile = new Map<string, string[]>();
    const locationsByProfile = new Map<string, string[]>();
    const softwareByProfile = new Map<string, string[]>();
    const licensesByProfile = new Map<string, any[]>();

    const addToMap = <T>(map: Map<string, T[]>, profileId: string, value: T) => {
      const existing = map.get(profileId);
      if (existing) {
        existing.push(value);
      } else {
        map.set(profileId, [value]);
      }
    };

    if (profileIds.length > 0) {
      const [
        { data: specializations },
        { data: locations },
        { data: software },
        { data: licenses },
      ] = await Promise.all([
        supabase
          .from('profile_specializations')
          .select('profile_id, specialization_slug')
          .in('profile_id', profileIds),
        supabase
          .from('profile_locations')
          .select('profile_id, state')
          .in('profile_id', profileIds),
        supabase
          .from('profile_software')
          .select('profile_id, software_slug')
          .in('profile_id', profileIds),
        supabase
          .from('licenses_public_view')
          .select('*')
          .in('profile_id', profileIds),
      ]);

      specializations?.forEach((row: { profile_id: string; specialization_slug: string }) => {
        addToMap(specializationsByProfile, row.profile_id, row.specialization_slug);
      });

      locations?.forEach((row: { profile_id: string; state: string }) => {
        addToMap(locationsByProfile, row.profile_id, row.state);
      });

      software?.forEach((row: { profile_id: string; software_slug: string }) => {
        addToMap(softwareByProfile, row.profile_id, row.software_slug);
      });

      licenses?.forEach((row: { profile_id: string }) => {
        addToMap(licensesByProfile, row.profile_id, row as any);
      });
    }

    const profilesWithDetails = filteredProfiles.map((profile) => ({
      ...profile,
      specializations: specializationsByProfile.get(profile.id) || [],
      states: locationsByProfile.get(profile.id) || [],
      software: softwareByProfile.get(profile.id) || [],
      licenses: licensesByProfile.get(profile.id) || [],
      verified: profile.visibility_state === 'verified',
      works_multistate: profile.works_multistate || false,
      works_international: profile.works_international || false,
      countries: profile.countries || []
    }));

    // Calculate correct total count - use filtered count if location filtering was applied
    const finalTotalCount = state ? totalAfterLocationFilter : (totalCountBeforeLocationFilter || 0);

    return NextResponse.json({
      profiles: profilesWithDetails,
      pagination: {
        page,
        limit,
        total: finalTotalCount,
        totalPages: Math.ceil(finalTotalCount / limit)
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
