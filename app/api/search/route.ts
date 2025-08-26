import { NextRequest, NextResponse } from 'next/server';

// Mock data for now - will be replaced with Supabase queries
const mockProfiles = [
  {
    id: '1',
    slug: 'jordan-chan-cpa',
    first_name: 'Jordan',
    last_name: 'Chan',
    headline: 'CPA • S-Corp & Multi-State',
    bio: '10+ years reviewing S-corps and multi-state filings; open for seasonal overflow.',
    credential_type: 'CPA',
    firm_name: 'Chan & Co.',
    public_email: 'jordan@chanandco.com',
    accepting_work: true,
    verified: true,
    specializations: ['s_corp', 'multi_state'],
    states: ['CA', 'AZ'],
    avatar_url: null
  },
  {
    id: '2',
    slug: 'maya-rodriguez-ea',
    headline: 'EA • IRS Representation',
    bio: 'Specializing in tax resolution and IRS representation for individuals and small businesses.',
    credential_type: 'EA',
    firm_name: 'Rodriguez Tax Solutions',
    public_email: 'maya@rodrigueztax.com',
    accepting_work: true,
    verified: true,
    specializations: ['irs_rep', '1040'],
    states: ['TX'],
    avatar_url: null
  },
  {
    id: '3',
    slug: 'leo-peterson-ctec',
    headline: 'CTEC • 1040 + Schedule C',
    bio: 'Seasonal tax preparer specializing in individual returns and small business schedules.',
    credential_type: 'CTEC',
    firm_name: 'Peterson Tax Prep',
    public_email: 'leo@petersontax.com',
    accepting_work: false,
    verified: true,
    specializations: ['1040', 'business'],
    states: ['CA'],
    avatar_url: null
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const query = searchParams.get('q') || '';
    const credentialType = searchParams.get('credential_type');
    const state = searchParams.get('state');
    const specialization = searchParams.get('specialization');
    const acceptingWork = searchParams.get('accepting_work');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Filter profiles based on search criteria
    let filteredProfiles = mockProfiles.filter(profile => {
      // Text search
      if (query) {
        const searchText = `${profile.headline} ${profile.bio} ${profile.firm_name}`.toLowerCase();
        if (!searchText.includes(query.toLowerCase())) {
          return false;
        }
      }
      
      // Credential type filter
      if (credentialType && profile.credential_type !== credentialType) {
        return false;
      }
      
      // State filter
      if (state && !profile.states.includes(state)) {
        return false;
      }
      
      // Specialization filter
      if (specialization && !profile.specializations.includes(specialization)) {
        return false;
      }
      
      // Availability filter
      if (acceptingWork === 'true' && !profile.accepting_work) {
        return false;
      }
      
      return true;
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);
    
    // Calculate pagination info
    const total = filteredProfiles.length;
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      profiles: paginatedProfiles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
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
