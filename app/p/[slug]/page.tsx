import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { jsonLd, personLD, breadcrumbsLD } from '@/lib/seo';
import ProfilePageClient from './ProfilePageClient';

type Props = { params: Promise<{ slug: string }> };

// Generate static params for top 500 newest verified profiles
export async function generateStaticParams() {
  const { createServerClient } = await import('@/lib/supabase/server');
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('slug')
    .eq('is_listed', true)
    .eq('visibility_state', 'verified')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error || !data) {
    console.error('Error fetching profiles for static generation:', error);
    return [];
  }

  return data.map((profile) => ({
    slug: profile.slug,
  }));
}

async function getProfile(slug: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, slug, first_name, last_name, credential_type,
      headline, bio, avatar_url, is_listed, visibility_state, updated_at,
      firm_name, linkedin_url, public_email, phone, website_url,
      accepting_work, works_multistate, works_international,
      years_experience, entity_revenue_range, opportunities,
      public_contact, countries, specializations, states, software, other_software,
      primary_location, created_at
    `)
    .eq('slug', slug)
    .single();
    
  if (error || !data) {
    console.log('🔍 Profile not found for slug:', slug, 'Error:', error);
    return null;
  }
  
  // Log profile status for debugging
  console.log('🔍 Profile found for slug:', slug);
  
  // Check visibility requirements - temporarily disabled for debugging
  // TODO: Re-enable strict visibility check once profiles are properly verified
  // if (!data.is_listed || data.visibility_state !== 'verified') {
  //   console.log('🔍 Profile not visible:', {
  //     slug: data.slug,
  //     is_listed: data.is_listed,
  //     visibility_state: data.visibility_state,
  //     reason: !data.is_listed ? 'not listed' : 'not verified'
  //   });
  //   return null;
  // }

  // Fetch specializations, locations, software, and licenses separately
  const [specializationsResult, locationsResult, softwareResult, licensesResult] = await Promise.all([
    supabase.from('profile_specializations').select('specialization_slug').eq('profile_id', data.id),
    supabase.from('profile_locations').select('state').eq('profile_id', data.id),
    supabase.from('profile_software').select('software_slug').eq('profile_id', data.id),
    supabase.from('licenses').select(`
      id, license_kind, license_number, issuing_authority,
      state, expires_on, board_profile_url, status
    `).eq('profile_id', (data as any)?.id || '').eq('status', 'verified')
  ]);

  // Update the profile data with the fetched specializations, locations, and software
  data.specializations = specializationsResult.data?.map(s => s.specialization_slug) || [];
  data.states = locationsResult.data?.map(l => l.state) || [];
  data.software = softwareResult.data?.map(s => s.software_slug) || [];
  const licenses = licensesResult.data || [];

  return {
    ...(data as any),
    licenses: licenses || []
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProfile(slug);
  if (!p) {
    return {
      title: 'Profile not found – TaxProExchange',
      robots: { index: false, follow: false }
    };
  }
  
  const fullName = `${p.first_name} ${p.last_name}`;
  const title = `${fullName}, ${p.credential_type} – ${p.headline ?? 'Verified Tax Pro'} | TaxProExchange`;
  const desc = (p.bio && p.bio.length > 155) ? p.bio.slice(0, 152) + '…' : (p.bio || `${fullName} is a verified ${p.credential_type} on TaxProExchange.`);
  const canonical = `https://www.taxproexchange.com/p/${slug}`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      type: 'profile',
      images: [{ url: `/p/${slug}/opengraph-image` }]
    },
    twitter: { 
      card: 'summary_large_image', 
      title, 
      description: desc 
    }
  };
}

// Optional: refresh profile pages hourly; adjust as needed
export const revalidate = 3600;

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const p = await getProfile(slug);
  if (!p) notFound();

  const crumbs = breadcrumbsLD([
    { name: 'Home', url: 'https://www.taxproexchange.com/' },
    { name: 'Profiles', url: 'https://www.taxproexchange.com/search' },
    { name: `${p.first_name} ${p.last_name}`, url: `https://www.taxproexchange.com/p/${slug}` },
  ]);

  // Transform profile data to match client component expectations
  const profileForClient = {
    ...p,
    verified: p.visibility_state === 'verified',
    public_contact: p.public_contact || false,
    countries: p.countries || [],
    specializations: p.specializations || [],
    states: p.states || [],
    software: p.software || [],
    other_software: p.other_software || [],
    opportunities: p.opportunities || '',
    licenses: p.licenses || [],
    works_multistate: p.works_multistate || false,
    works_international: p.works_international || false,
    years_experience: p.years_experience || '',
    entity_revenue_range: p.entity_revenue_range || '',
    primary_location: p.primary_location || null,
    created_at: p.created_at || '',
    profile_locations: []
  };

  const personJsonLd = personLD({
    slug: p.slug,
    first_name: p.first_name,
    last_name: p.last_name,
    credential_type: p.credential_type,
    bio: p.bio,
    avatar_url: p.avatar_url,
    headline: p.headline,
    firm_name: p.firm_name,
    linkedin_url: p.linkedin_url,
    website_url: p.website_url
  });

  return (
    <>
      {/* JSON-LD: Person + BreadcrumbList */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={jsonLd(personJsonLd)} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={jsonLd(crumbs)} 
      />
      
      {/* Client-side profile component */}
      <ProfilePageClient profile={profileForClient} />
    </>
  );
}
