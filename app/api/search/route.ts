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
    const state = searchParams.get('state') || '';
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

    // Get total count first
    const { count: totalCount } = await supabaseQuery;

    // Execute the query with pagination
    // Order by verified status first, then by created_at
    const { data: profiles, error } = await supabaseQuery
      .order('visibility_state', { ascending: false }) // 'verified' comes before 'pending_verification'
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Failed to search profiles' },
        { status: 500 }
      );
    }

    console.log('🔍 Search API - Raw profiles found:', profiles?.length || 0);
    console.log('🔍 Search parameters:', { query, credential_type, specializations, software, state, accepting_work, verified_only, years_experience });
    
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

    // Filter by professional's location if specified
    if (state) {
      console.log('🔍 Filtering by professional location:', state);
      
      // Filter by primary_location state (where the professional is located)
      // This matches the location display logic
      filteredProfiles = filteredProfiles.filter(p => {
        const primaryState = p.primary_location?.state;
        const isMatch = primaryState === state;
        console.log('🔍 Profile', p.first_name, p.last_name, 'primary_location state:', primaryState, 'matches', state, ':', isMatch);
        return isMatch;
      });
      
      console.log('🔍 Filtered profiles count by location:', filteredProfiles.length);
    }

    // Filter by specific country if specified
    if (country) {
      filteredProfiles = filteredProfiles.filter(p => 
        p.works_international && p.countries && p.countries.includes(country)
      );
    }

    // Software filtering is now handled in the SQL query above for better performance

    // Fetch specializations, locations, software, and licenses for each profile
    const profilesWithDetails = await Promise.all(
      filteredProfiles.map(async (profile) => {
        // Get specializations
        const { data: specializations } = await supabase
          .from('profile_specializations')
          .select('specialization_slug')
          .eq('profile_id', profile.id);

        // Get locations
        const { data: locations } = await supabase
          .from('profile_locations')
          .select('state')
          .eq('profile_id', profile.id);

        // Get software
        const { data: software } = await supabase
          .from('profile_software')
          .select('software_slug')
          .eq('profile_id', profile.id);

        // Get licenses using the public view (never includes license_number)
        const { data: licenses } = await supabase
          .from('licenses_public_view')
          .select('*')
          .eq('profile_id', profile.id);

        return {
          ...profile,
          specializations: specializations?.map(s => s.specialization_slug) || [],
          states: locations?.map(l => l.state) || [],
          software: software?.map(s => s.software_slug) || [],
          licenses: licenses || [],
          verified: profile.visibility_state === 'verified',
          works_multistate: profile.works_multistate || false,
          works_international: profile.works_international || false,
          countries: profile.countries || []
        };
      })
    );

    return NextResponse.json({
      profiles: profilesWithDetails,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
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
