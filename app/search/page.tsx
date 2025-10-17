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

export default function SearchPage({ searchParams }: Props) {
  // Keep minimal JSON-LD for FAQ schema (still good for SEO)
  const faqSchema = generateFaqJsonLd(faqs);

  return (
    <>
      <JsonLd data={faqSchema} />
      <AnalyticsPageView eventName="view_search_prefilter" />
      
      <SearchPageClient />
    </>
  );
}
