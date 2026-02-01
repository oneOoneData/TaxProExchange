import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AppNavigation from '@/components/AppNavigation';
import { createServerClient } from '@/lib/supabase/server';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbsLD } from '@/lib/seo';

type RawProfile = {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  credential_type: string;
  headline: string | null;
  primary_location:
    | {
        city?: string | null;
        state?: string | null;
        country?: string | null;
        display_name?: string | null;
      }
    | string
    | null;
  accepting_work: boolean | null;
};

type DirectoryProfile = {
  slug: string;
  name: string;
  credential: string;
  headline: string;
  location: string;
  accepting_work: boolean;
};

type NormalizedLocation = {
  city: string | null;
  state: string | null;
  country: string | null;
  displayName: string | null;
};

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

// Create reverse lookup: state name -> code
const STATE_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_NAMES).map(([code, name]) => [name.toLowerCase(), code])
);

// Create slug lookup: slug -> state code
const STATE_SLUG_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_NAMES).map(([code, name]) => [
    name.toLowerCase().replace(/\s+/g, '-'),
    code,
  ])
);

// Helper to convert slug to state code
function slugToStateCode(slug: string): string | null {
  return STATE_SLUG_TO_CODE[slug.toLowerCase()] || null;
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLocation(raw: RawProfile['primary_location']): NormalizedLocation | null {
  if (!raw) return null;
  let location: unknown = raw;

  const tryParse = (value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      const normalizedNulls = value.replace(/:\s*NULL/gi, ': null');
      return normalizedNulls;
    }
  };

  if (typeof location === 'string') {
    let parsed: unknown = location.trim();
    for (let attempts = 0; attempts < 4 && typeof parsed === 'string'; attempts += 1) {
      const next = tryParse(parsed);
      if (typeof next !== 'string') {
        parsed = next;
        break;
      }
      if (next === parsed) {
        break;
      }
      parsed = next.trim();
    }
    location = parsed;
  }

  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    return null;
  }

  const locationData = location as Record<string, unknown>;
  const pickString = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = locationData[key];
      if (typeof value === 'string') {
        return value;
      }
    }
    return null;
  };

  const city = pickString('city', 'CITY');
  const state = pickString('state', 'STATE');
  const country = pickString('country', 'COUNTRY');
  const displayName = pickString('display_name', 'DISPLAY_NAME');

  return {
    city: city ? toTitleCase(city) : null,
    state: state ? state.trim() : null,
    country: country ? country.trim() : null,
    displayName: displayName ? displayName.trim() : null,
  };
}

function normalizeState(value: string | null): string | null {
  if (!value) return null;
  let state = value.trim();
  if (!state) return null;
  if (state.includes(',')) {
    state = state.split(',')[0].trim();
  }
  const upper = state.toUpperCase();
  if (US_STATE_NAMES[upper]) {
    return upper;
  }
  const match = Object.entries(US_STATE_NAMES).find(
    ([, name]) => name.toUpperCase() === upper
  );
  return match ? match[0] : null;
}

function formatLocationString(
  location: NormalizedLocation,
  stateCode: string | null
) {
  if (location.displayName) return location.displayName;

  const parts: string[] = [];

  if (location.city) {
    parts.push(location.city);
  }

  if (stateCode) {
    parts.push(stateCode);
  }

  return parts.join(', ');
}

async function fetchProfilesForState(stateCode: string): Promise<DirectoryProfile[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, slug, first_name, last_name, credential_type, headline, primary_location, accepting_work')
    .eq('visibility_state', 'verified')
    .eq('is_listed', true)
    .order('created_at', { ascending: false })
    .limit(1200);
  
  if (!data) return [];

  const profiles: DirectoryProfile[] = [];

  data.forEach((profile) => {
    if (!profile.slug) return;

    const location = parseLocation(profile.primary_location);
    if (!location || !location.country || location.country.toUpperCase() !== 'US') return;

    const profileStateCode = normalizeState(location.state);
    if (profileStateCode !== stateCode) return;

    profiles.push({
      slug: profile.slug,
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      credential: profile.credential_type,
      headline: profile.headline || '',
      location: formatLocationString(location, stateCode),
      accepting_work: Boolean(profile.accepting_work),
    });
  });

  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

export const revalidate = 300;

type Props = { params: Promise<{ state: string }> };

export async function generateStaticParams() {
  return Object.keys(US_STATE_NAMES).map((code) => {
    const stateName = US_STATE_NAMES[code];
    const slug = stateName.toLowerCase().replace(/\s+/g, '-');
    return { state: slug };
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateCode = slugToStateCode(state);
  
  if (!stateCode) {
    return {
      title: 'State not found | TaxProExchange',
      robots: { index: false, follow: false },
    };
  }

  const stateName = US_STATE_NAMES[stateCode];
  const canonical = `https://www.taxproexchange.com/directory/by-location/${state}`;

  return {
    title: `Tax Professionals in ${stateName} | TaxProExchange`,
    description: `Browse verified tax professionals (CPAs, EAs, attorneys) licensed or working in ${stateName}. All listings are credential-verified and opt-in for public discovery.`,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `Tax Professionals in ${stateName} | TaxProExchange`,
      description: `Browse verified tax professionals in ${stateName}. All listings are credential-verified.`,
      url: canonical,
      type: 'website',
      siteName: 'TaxProExchange',
    },
    twitter: {
      card: 'summary',
      title: `Tax Professionals in ${stateName} | TaxProExchange`,
      description: `Browse verified tax professionals in ${stateName}.`,
    },
  };
}

export default async function StateDirectoryPage({ params }: Props) {
  const { state } = await params;
  const stateCode = slugToStateCode(state);

  if (!stateCode) {
    notFound();
  }

  const stateName = US_STATE_NAMES[stateCode];
  const profiles = await fetchProfilesForState(stateCode);
  const canonical = `https://www.taxproexchange.com/directory/by-location/${state}`;

  // Breadcrumb JSON-LD
  const breadcrumbSchema = breadcrumbsLD([
    { name: 'Home', url: 'https://www.taxproexchange.com/' },
    { name: 'Directory by Location', url: 'https://www.taxproexchange.com/directory/by-location' },
    { name: stateName, url: canonical },
  ]);

  // CollectionPage JSON-LD for directory listing
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Tax Professionals in ${stateName}`,
    description: `Directory of verified tax professionals (CPAs, EAs, attorneys) in ${stateName}`,
    url: canonical,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: profiles.length,
      itemListElement: profiles.slice(0, 10).map((profile, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Person',
          name: profile.name,
          url: `https://www.taxproexchange.com/p/${profile.slug}`,
          jobTitle: profile.credential,
        },
      })),
    },
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionSchema} />
      <AppNavigation />
      <div className="bg-slate-50 min-h-screen">
        <div className="container-mobile py-12 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Link href="/directory/by-location" className="hover:text-slate-900">
                Directory by Location
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">{stateName}</span>
            </div>
            
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Directory</p>
            <h1 className="text-4xl font-semibold text-slate-900">
              Verified Tax Professionals in {stateName}
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl">
              Every listing on this page is credential-verified and opt-in for public discovery.
              {profiles.length > 0 && (
                <> Found {profiles.length} verified professional{profiles.length !== 1 ? 's' : ''} in {stateName}.</>
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/directory/by-location"
                className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                ← Back to All Locations
              </Link>
              <Link
                href="/search"
                className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open Search Directory
              </Link>
            </div>
          </section>

          {profiles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
              No verified profiles found for {stateName} yet. As soon as someone completes
              verification and saves their location in {stateName}, they will appear here.
            </div>
          ) : (
            <section className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {stateName} Tax Professionals
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {profiles.length} verified professional{profiles.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ul className="px-4 pb-4 pt-2 space-y-2 text-sm">
                  {profiles.map((profile) => (
                    <li key={profile.slug}>
                      <Link
                        href={`/p/${profile.slug}`}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-900">{profile.name}</span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {profile.credential || 'Verified'}
                            </span>
                            {profile.accepting_work && (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Accepting work
                              </span>
                            )}
                          </div>
                          {profile.location && (
                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                              {profile.location}
                            </p>
                          )}
                          {profile.headline && (
                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{profile.headline}</p>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                          View profile
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M7 5l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

