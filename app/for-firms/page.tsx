import { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';
import { siteUrl, generateFaqJsonLd } from '@/lib/seo';
import SolutionCTA from '@/components/seo/SolutionCTA';
import AnalyticsPageView from '@/components/analytics/AnalyticsPageView';

export const metadata: Metadata = {
  title: 'For Tax Firms: Verified Overflow Staffing & Niche Expertise | TaxProExchange',
  description: 'Scale your CPA firm with verified professionals for overflow staffing, review & sign-off, IRS representation, SALT, and niche tax work. No full-time hires required.',
  alternates: { canonical: `${siteUrl}/for-firms` },
  openGraph: {
    title: 'For Tax Firms: Verified Overflow Staffing & Niche Expertise',
    description: 'Scale your CPA firm with verified professionals for overflow staffing, review & sign-off, IRS representation, SALT, and niche tax work.',
    url: `${siteUrl}/for-firms`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Tax Firms: Verified Overflow Staffing & Niche Expertise',
    description: 'Scale your CPA firm with verified professionals for overflow staffing, review & sign-off, IRS representation, SALT, and niche tax work.',
  },
};

const faqs = [
  {
    question: 'How do you verify credentials?',
    answer: 'We manually check state CPA boards, IRS EA enrollment, and CTEC registration before profiles go live. Only verified, active credentials appear in our directory.'
  },
  {
    question: 'Can we hire someone for short-term projects?',
    answer: 'Yes. TaxProExchange is built for flexible, project-based engagements—from a few days to an entire busy season. You negotiate scope, timeline, and payment directly.'
  },
  {
    question: 'Do you handle contracts or payments?',
    answer: 'No. TaxProExchange is a connection-only platform. Your firm handles contracts, payments, and file exchange directly with the professional you hire.'
  },
  {
    question: 'What if we need someone in a specific state or specialization?',
    answer: 'Our search filters let you narrow by state license, credential type, specialization (S-corp, SALT, trusts, crypto, etc.), and availability. Find exactly the expertise you need.'
  },
  {
    question: 'Is there a cost to use TaxProExchange?',
    answer: 'Creating a firm account and browsing verified professionals is free. We may introduce premium features in the future, but our core directory remains accessible to all tax firms.'
  }
];

export default function ForFirmsPage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'For Tax Firms',
    description: 'Scale your CPA firm with verified professionals for overflow staffing, review & sign-off, IRS representation, and niche tax work.',
    url: `${siteUrl}/for-firms`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'For Firms', item: `${siteUrl}/for-firms` },
      ],
    },
  };

  const faqSchema = generateFaqJsonLd(faqs);

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={faqSchema} />
      <AnalyticsPageView eventName="view_for_firms" />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Hero */}
        <section className="relative overflow-hidden bg-slate-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Scale Your Firm Without Full-Time Hires
              </h1>
              <p className="mt-6 text-xl text-slate-300">
                Verified CPAs & EAs for overflow, reviews, and niche work. No recruiting overhead. No long-term commitments. Just direct connections with licensed professionals who can step in when you need them.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/join"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-slate-900 bg-white hover:bg-slate-100 shadow-lg transition-all"
                >
                  Create Firm Account
                </Link>
                <a
                  href="mailto:hello@taxproexchange.com?subject=Book 15-min Demo"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                >
                  Book 15-min Demo
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="text-emerald-600 font-semibold mb-2">Verified Credentials</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Only Licensed Pros
                </h3>
                <p className="text-slate-600">
                  Every CPA, EA, and CTEC credential is manually verified before profiles go live. Work with confidence knowing you're connecting with active, licensed professionals.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="text-emerald-600 font-semibold mb-2">Flexible Engagements</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  No Long-Term Commitments
                </h3>
                <p className="text-slate-600">
                  Hire for a week, a season, or a single project. You control scope, timeline, and payment. No platform fees, no middleman—just direct professional relationships.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="text-emerald-600 font-semibold mb-2">Niche Expertise</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Find the Right Specialist
                </h3>
                <p className="text-slate-600">
                  Search by state, credential, and specialization—SALT, crypto, trusts, IRS rep, partnership returns. Find exactly the expertise your engagement requires.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">
                How Tax Firms Use TaxProExchange
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                From seasonal overflow to niche expertise, firms use our platform to scale capacity without the overhead of full-time hiring.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Overflow Staffing', href: '/solutions/overflow-staffing', desc: 'Handle seasonal surges without full-time hires' },
                { title: 'Review & Sign-Off', href: '/solutions/review-and-signoff', desc: 'Independent CPA/EA review for complex returns' },
                { title: 'IRS Representation', href: '/solutions/irs-representation-ea-cpa', desc: 'Audits, appeals, and collections specialists' },
                { title: 'Multi-State SALT', href: '/solutions/multi-state-salt', desc: 'Nexus, apportionment, and state tax expertise' },
                { title: 'Crypto Tax', href: '/solutions/crypto-tax', desc: 'Digital asset, DeFi, and NFT specialists' },
                { title: 'Trusts & Estates', href: '/solutions/trusts-and-estates', desc: 'Form 1041, 706, and fiduciary returns' },
                { title: 'K-1 & Partnership Returns', href: '/solutions/k1-surge-support', desc: 'Form 1065 and partnership surge support' },
                { title: 'White-Label Prep', href: '/solutions/white-label-tax-prep', desc: 'Behind-the-scenes prep under your brand' },
              ].map((useCase) => (
                <Link
                  key={useCase.href}
                  href={useCase.href}
                  className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-slate-300 transition-all"
                >
                  <h3 className="font-semibold text-slate-900 mb-2">{useCase.title}</h3>
                  <p className="text-sm text-slate-600">{useCase.desc}</p>
                  <div className="mt-4 text-sm text-blue-600 font-medium">Learn more →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Simple, direct connections with verified professionals. No platform fees, no barriers.
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Search', desc: 'Filter by credential, state, specialization, and availability' },
                { step: '2', title: 'Review Profiles', desc: 'See verified credentials, experience, and specializations' },
                { step: '3', title: 'Connect', desc: 'Reach out directly to discuss scope, timeline, and fees' },
                { step: '4', title: 'Engage', desc: 'Handle contracts, payments, and work directly—no middleman' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white font-semibold mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <SolutionCTA to="/search?accepting_work=true">
                Browse Verified Pros
              </SolutionCTA>
            </div>
          </div>
        </section>

        {/* Verification */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 md:p-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                How Verification Works
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 mb-4">
                  Every professional on TaxProExchange goes through manual credential verification before their profile is visible. We check:
                </p>
                <ul className="text-slate-600 space-y-2 mb-4">
                  <li><strong>CPA licenses:</strong> Verified with state boards of accountancy</li>
                  <li><strong>EA enrollment:</strong> Confirmed with IRS Enrolled Agent database</li>
                  <li><strong>CTEC registration:</strong> Checked with California Tax Education Council</li>
                  <li><strong>Active status:</strong> All credentials must be current and in good standing</li>
                </ul>
                <p className="text-slate-600">
                  No self-certification, no honor system. If a credential can't be verified, the profile doesn't go live. Learn more about our <Link href="/trust" className="text-blue-600 hover:underline">verification process</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {faqs.map((faq, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
                    <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                    <p className="text-slate-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Scale Your Firm?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Create a firm account and start connecting with verified CPAs, EAs, and tax professionals today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/join"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-slate-900 bg-white hover:bg-slate-100 shadow-lg transition-all"
              >
                Create Firm Account
              </Link>
              <SolutionCTA to="/search?accepting_work=true">
                Browse Directory
              </SolutionCTA>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

