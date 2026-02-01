import { Metadata } from 'next';
import Link from 'next/link';
import AppNavigation from '@/components/AppNavigation';
import { createServerClient } from '@/lib/supabase/server';
import { COUNTRIES, getCountryName } from '@/lib/constants/countries';

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
  states: string[] | null;
  countries: string[] | null;
  works_international: boolean | null;
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

const COUNTRY_NAME_LOOKUP = new Map<string, string>(
  COUNTRIES.map((country) => [country.name.toUpperCase(), country.code])
);

// Helper to convert state code to URL-friendly slug
function stateToSlug(stateCode: string): string {
  const stateName = US_STATE_NAMES[stateCode];
  if (!stateName) return stateCode.toLowerCase();
  return stateName.toLowerCase().replace(/\s+/g, '-');
}

type LocationGroup = {
  key: string;
  label: string;
  profiles: DirectoryProfile[];
  isState?: boolean; // Flag to indicate if this is a US state
};

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Directory by Location | TaxProExchange',
  description: 'Browse verified tax professionals grouped by US state and international coverage.',
};

async function fetchProfiles(): Promise<RawProfile[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, slug, first_name, last_name, credential_type, headline, primary_location, states, countries, works_international, accepting_work')
    .eq('visibility_state', 'verified')
    .eq('is_listed', true)
    .order('created_at', { ascending: false })
    .limit(1200);
  return data ?? [];
}

function normalizeCountry(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }
  const lookup = COUNTRY_NAME_LOOKUP.get(trimmed.toUpperCase());
  if (lookup) {
    return lookup;
  }
  if (trimmed.toUpperCase() === 'USA' || trimmed.toUpperCase() === 'UNITED STATES') {
    return 'US';
  }
  return null;
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

function formatLocationString(
  location: NormalizedLocation,
  stateCode: string | null,
  countryCode: string | null
) {
  if (location.displayName) return location.displayName;

  const parts: string[] = [];

  if (location.city) {
    parts.push(location.city);
  }

  if (countryCode === 'US' && stateCode) {
    parts.push(stateCode);
  } else if (countryCode && countryCode !== 'US') {
    parts.push(getCountryName(countryCode));
  }

  return parts.join(', ');
}

function buildGroups(profiles: RawProfile[]) {
  const states = new Map<string, DirectoryProfile[]>();
  const countries = new Map<string, DirectoryProfile[]>();

  profiles.forEach((profile) => {
    if (!profile.slug) return;

    const location = parseLocation(profile.primary_location);
    if (!location || !location.country) return;

    const countryCode = normalizeCountry(location.country);
    if (!countryCode) return;

    const stateCode =
      countryCode === 'US' ? normalizeState(location.state) : null;

    const entry: DirectoryProfile = {
      slug: profile.slug,
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      credential: profile.credential_type,
      headline: profile.headline || '',
      location: formatLocationString(location, stateCode, countryCode),
      accepting_work: Boolean(profile.accepting_work),
    };

    if (countryCode === 'US') {
      if (!stateCode) return;
      if (!states.has(stateCode)) states.set(stateCode, []);
      states.get(stateCode)!.push(entry);
      return;
    }

    if (!countries.has(countryCode)) countries.set(countryCode, []);
    countries.get(countryCode)!.push(entry);
  });

  const sortGroups = (map: Map<string, DirectoryProfile[]>, label: (key: string) => string): LocationGroup[] =>
    Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, profiles]) => ({
        key,
        label: label(key),
        profiles: profiles.sort((a, b) => a.name.localeCompare(b.name)),
      }));

  return {
    stateGroups: sortGroups(states, (code) => US_STATE_NAMES[code] || code).map(group => ({
      ...group,
      isState: true,
    })),
    countryGroups: sortGroups(countries, (code) => getCountryName(code)),
  };
}

function LocationSection({
  title,
  description,
  groups,
}: {
  title: string;
  description: string;
  groups: LocationGroup[];
}) {
  if (!groups.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-slate-600">{description}</p>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const stateSlug = group.isState ? stateToSlug(group.key) : null;
          const stateUrl = stateSlug ? `/directory/by-location/${stateSlug}` : null;

          return (
            <div key={group.key} className="rounded-2xl border border-slate-200 bg-white">
              <details>
                <summary className="flex items-center justify-between px-4 py-3 border-b border-slate-100 cursor-pointer">
                  <div className="flex items-center gap-2">
                    {stateUrl ? (
                      <Link
                        href={stateUrl}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        {group.label}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">{group.label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{group.profiles.length} verified</span>
                    <svg
                      className="h-4 w-4 text-slate-400"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </summary>
                <ul className="px-4 pb-4 pt-2 space-y-2 text-sm">
              {group.profiles.map((profile) => (
                <li key={`${group.key}-${profile.slug}`}>
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
              </details>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function DirectoryByLocationPage() {
  const profiles = await fetchProfiles();
  const { stateGroups, countryGroups } = buildGroups(profiles);
  const hasLocations = stateGroups.length > 0 || countryGroups.length > 0;

  return (
    <>
      <AppNavigation />
      <div className="bg-slate-50 min-h-screen">
        <div className="container-mobile py-12 space-y-12">
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Directory</p>
          <h1 className="text-4xl font-semibold text-slate-900">Verified Pros by Location</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Every listing on this page is credential-verified and opt-in for public discovery.
            Use the search directory for advanced filters or jump straight to a state or international region below.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/search"
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open Search Directory
            </Link>
            <Link
              href="/trust"
              className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              How verification works
            </Link>
          </div>

          {!hasLocations && (
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
              No verified profiles have shared a primary location yet. As soon as someone completes
              verification and saves their city/state (or international country) the list will
              populate automatically.
            </div>
          )}
        </section>

          <LocationSection
            title="United States Coverage"
            description="Browse CPAs, EAs, attorneys, and consultants licensed or working in each state."
            groups={stateGroups}
          />

          <LocationSection
            title="International & Cross-Border"
            description="Profiles that explicitly support clients outside the United States."
            groups={countryGroups}
          />
        </div>
      </div>
    </>
  );
}

