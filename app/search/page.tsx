import { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';
import JsonLd from '@/components/seo/JsonLd';
import { siteUrl, generateFaqJsonLd } from '@/lib/seo';
import AnalyticsPageView from '@/components/analytics/AnalyticsPageView';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  
  // Check if there are any search params (faceted search)
  const hasFacets = Object.keys(params).length > 0;
  
  // Noindex faceted search URLs to avoid duplicate content
  const robotsDirective = hasFacets 
    ? { index: false, follow: true }
    : undefined;

  return {
    title: 'Search Verified CPAs, EAs & Tax Preparers | TaxProExchange',
    description: 'Find verified tax professionals for overflow staffing, review & sign-off, IRS representation, multi-state SALT, crypto tax, trusts, K-1 support, and more. Search by credential, state, and specialization.',
    alternates: { canonical: `${siteUrl}/search` },
    robots: robotsDirective,
    openGraph: {
      title: 'Search Verified CPAs, EAs & Tax Preparers',
      description: 'Find verified tax professionals for overflow staffing, review & sign-off, IRS representation, and niche tax work.',
      url: `${siteUrl}/search`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Search Verified CPAs, EAs & Tax Preparers',
      description: 'Find verified tax professionals for overflow staffing, review & sign-off, and niche tax work.',
    },
  };
}

const faqs = [
  {
    question: 'How do I find professionals for overflow staffing?',
    answer: 'Use the "Accepting Work" filter to find CPAs and EAs available for immediate engagement. Filter by state, credential type, and specialization to find professionals who match your firm\'s needs.'
  },
  {
    question: 'Can I search for specialists in IRS representation or SALT?',
    answer: 'Yes. Use the specialization filter to find professionals with expertise in IRS representation, multi-state SALT, crypto tax, trusts & estates, partnership returns, and more.'
  },
  {
    question: 'Are all professionals verified?',
    answer: 'Yes. Every CPA, EA, and CTEC credential is manually verified with state boards and the IRS before profiles are visible in search results.'
  }
];

// Static specialty & state data for SEO — visible to crawlers above the client-rendered search
const TOP_SPECIALTIES = [
  { name: 'SALT (State & Local Tax)', slug: 'salt', count: '15+' },
  { name: 'IRS Representation', slug: 'irs-representation', count: '20+' },
  { name: 'Crypto & Digital Assets', slug: 'crypto', count: '8+' },
  { name: 'Trusts & Estates', slug: 'trusts-estates', count: '12+' },
  { name: 'K-1 & Partnership Returns', slug: 'k-1-partnership', count: '25+' },
  { name: 'International Tax', slug: 'international', count: '10+' },
  { name: 'Tax Controversy', slug: 'tax-controversy', count: '6+' },
  { name: 'Bookkeeping & Write-Up', slug: 'bookkeeping', count: '20+' },
];

const TOP_STATES = ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Colorado', 'Arizona', 'Georgia'];

export default function SearchPage({ searchParams }: Props) {
  const faqSchema = generateFaqJsonLd(faqs);

  return (
    <>
      <JsonLd data={faqSchema} />
      <AnalyticsPageView eventName="view_search_prefilter" />

      {/* Static SEO content — always visible to crawlers */}
      <div className="sr-only md:not-sr-only max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="text-sm text-slate-600 space-y-3">
          <p>
            <strong>Search 475+ verified tax professionals</strong> — CPAs, EAs, and CTEC-registered preparers.
            Filter by credential, state, specialization, and availability.
          </p>
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800">
              Browse top specialties
            </summary>
            <div className="flex flex-wrap gap-2 mt-2">
              {TOP_SPECIALTIES.map(s => (
                <Link
                  key={s.slug}
                  href={`/search?specialization=${s.slug}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs hover:bg-blue-100 transition-colors"
                >
                  {s.name} ({s.count})
                </Link>
              ))}
            </div>
          </details>
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800">
              Browse by state
            </summary>
            <div className="flex flex-wrap gap-2 mt-2">
              {TOP_STATES.map(state => (
                <Link
                  key={state}
                  href={`/search?state=${state.toLowerCase()}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs hover:bg-emerald-100 transition-colors"
                >
                  {state}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>

      <SearchPageClient />
    </>
  );
}
