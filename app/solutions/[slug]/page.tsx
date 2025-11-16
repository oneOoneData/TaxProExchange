import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';
import SolutionCTA from '@/components/seo/SolutionCTA';
import { SOLUTIONS, Solution } from '@/lib/constants/solutions';
import { siteUrl, generateFaqJsonLd } from '@/lib/seo';
import AnalyticsPageView from '@/components/analytics/AnalyticsPageView';

type Props = { params: Promise<{ slug: string }> };

// Generate static params for all solution pages
export async function generateStaticParams() {
  return SOLUTIONS.map((solution) => ({
    slug: solution.slug,
  }));
}

function getSolution(slug: string): Solution | null {
  return SOLUTIONS.find((s) => s.slug === slug) || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolution(slug);

  if (!solution) {
    return {
      title: 'Solution not found – TaxProExchange',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${solution.title} | TaxProExchange`,
    description: solution.description,
    alternates: { canonical: `${siteUrl}/solutions/${slug}` },
    openGraph: {
      title: solution.title,
      description: solution.description,
      url: `${siteUrl}/solutions/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: solution.title,
      description: solution.description,
    },
  };
}

// Revalidate solution pages weekly
export const revalidate = 604800;

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const solution = getSolution(slug);

  if (!solution) {
    notFound();
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'For Firms', item: `${siteUrl}/for-firms` },
      { '@type': 'ListItem', position: 3, name: solution.title, item: `${siteUrl}/solutions/${slug}` },
    ],
  };

  const faqSchema = generateFaqJsonLd(solution.faqs);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />
      <AnalyticsPageView eventName="view_solution" properties={{ slug, title: solution.title }} />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Hero */}
        <section className="relative overflow-hidden bg-slate-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="max-w-4xl">
              <nav className="text-sm text-slate-400 mb-4">
                <Link href="/for-firms" className="hover:text-white">For Firms</Link>
                <span className="mx-2">/</span>
                <span className="text-slate-300">{solution.title}</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {solution.h1}
              </h1>
              <p className="mt-4 text-xl text-slate-300">
                {solution.description}
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg prose-slate max-w-none">
                {solution.intro.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-slate-700 mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* When to Use */}
              <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  When to Use {solution.title}
                </h2>
                <ul className="space-y-4">
                  {solution.whenToUse.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-3 text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <SolutionCTA to={solution.searchQuery}>
                    Browse Verified Pros
                  </SolutionCTA>
                </div>
              </div>

              {/* How Verification Works */}
              <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  How Verification Works
                </h2>
                <p className="text-slate-700 mb-4">
                  Every professional on TaxProExchange is credential-verified before their profile goes live. We manually check CPA state board records, IRS EA enrollment, and CTEC registration to ensure you&rsquo;re working with licensed, active professionals.
                </p>
                <p className="text-slate-700">
                  Learn more about our <Link href="/trust" className="text-blue-600 hover:underline font-medium">verification process</Link> and why trust is the default on TaxProExchange.
                </p>
              </div>

              {/* FAQ */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                  {solution.faqs.map((faq, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
                      <h3 className="font-semibold text-slate-900 mb-2 text-lg">{faq.question}</h3>
                      <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Solutions */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Related Solutions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SOLUTIONS.filter((s) => s.slug !== slug)
                    .slice(0, 4)
                    .map((relatedSolution) => (
                      <Link
                        key={relatedSolution.slug}
                        href={`/solutions/${relatedSolution.slug}`}
                        className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-slate-300 transition-all"
                      >
                        <h3 className="font-semibold text-slate-900 mb-2">{relatedSolution.title}</h3>
                        <p className="text-sm text-slate-600">{relatedSolution.description}</p>
                        <div className="mt-4 text-sm text-blue-600 font-medium">Learn more →</div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Find the Right Professional?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Browse verified CPAs, EAs, and tax professionals with the exact expertise you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SolutionCTA to={solution.searchQuery}>
                Search Verified Pros
              </SolutionCTA>
              <Link
                href="/for-firms"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                Explore All Solutions
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

