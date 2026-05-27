import { Metadata } from 'next';
import Link from 'next/link';
import AppNavigation from '@/components/AppNavigation';
import JsonLd from '@/components/seo/JsonLd';
import DemoRequestButton from '@/components/DemoRequestButton';
import { siteUrl, generateFaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Pricing – Free for Tax Professionals, $30/mo for Firms | TaxProExchange',
  description: 'TaxProExchange is free for individual CPAs, EAs, and CTEC preparers. Firm Workspace is $30/month — build your verified bench, manage your team, and find overflow help fast.',
  alternates: { canonical: `${siteUrl}/pricing` },
  openGraph: {
    title: 'Pricing – Free for Tax Professionals, $30/mo for Firms | TaxProExchange',
    description: 'Free for individual tax professionals. Firm Workspace is $30/month — no contracts, cancel anytime.',
    url: `${siteUrl}/pricing`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | TaxProExchange',
    description: 'Free for CPAs & EAs. $30/month for Firm Workspace.',
  },
};

const faqs = [
  {
    question: 'Is TaxProExchange really free for individual tax professionals?',
    answer: 'Yes — forever. Individual CPAs, EAs, and CTEC preparers can create a verified profile, search the directory, connect with other professionals, and access mentorship at no cost.',
  },
  {
    question: 'What does the Firm Workspace include?',
    answer: 'Firm Workspace ($30/month) gives you a private bench to save and categorize verified professionals, team member access, the ability to send invitations, and an optional public firm profile page.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. There are no contracts or cancellation fees. You can cancel your Firm Workspace subscription at any time from your settings.',
  },
  {
    question: 'Do you charge per seat or per user?',
    answer: 'No per-seat fees. Firm Workspace is a flat $30/month regardless of how many team members you add.',
  },
  {
    question: 'Does TaxProExchange handle payments between firms and professionals?',
    answer: 'No. TaxProExchange is a connection-only platform. All contracts, payments, and file sharing happen directly between the firm and the professional — off-platform.',
  },
  {
    question: 'Is there a free trial for Firm Workspace?',
    answer: 'We occasionally offer trial periods. Reach out via the demo request form and we can discuss what works best for your firm.',
  },
];

const Check = ({ blue }: { blue?: boolean }) => (
  <svg
    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${blue ? 'text-blue-500' : 'text-emerald-500'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function PricingPage() {
  const faqSchema = generateFaqJsonLd(faqs);

  const pricingSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'TaxProExchange Pricing',
    description: 'Free for individual tax professionals. Firm Workspace at $30/month.',
    url: `${siteUrl}/pricing`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${siteUrl}/pricing` },
      ],
    },
  };

  return (
    <>
      <JsonLd data={pricingSchema} />
      <JsonLd data={faqSchema} />
      <AppNavigation />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Hero */}
        <section className="pt-16 pb-8 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Free for individual tax professionals. Affordable for firms that need a trusted bench.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="py-8 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Individual */}
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-slate-900">Individual</h2>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Free forever
                </span>
              </div>
              <div className="mb-6">
                <div className="text-4xl font-bold text-slate-900">$0</div>
                <div className="text-slate-500 text-sm">No credit card required</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Verified professional profile (CPA, EA, CTEC)',
                  'Search and filter the full directory',
                  'Direct messaging with other professionals',
                  'Send and receive connection requests',
                  'Access mentorship opportunities',
                  'Apply to posted jobs',
                  'Receive overflow work requests',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/join"
                className="block text-center rounded-2xl bg-slate-900 text-white px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Join Free
              </Link>
            </div>

            {/* Firm Workspace */}
            <div className="rounded-3xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white p-8 shadow-lg flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-bl-full opacity-10" />
              <div className="relative flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-slate-900">Firm Workspace</h2>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Most popular
                  </span>
                </div>
                <div className="mb-2">
                  <div className="text-4xl font-bold text-slate-900">$30</div>
                  <div className="text-slate-500 text-sm">per month · cancel anytime</div>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Everything in Individual, plus tools to manage your bench and scale your firm.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    ['Post jobs to the talent pool', true],
                    ['Build a private bench of verified professionals', true],
                    ['Categorize by specialty (IRS rep, SALT, crypto, etc.)', true],
                    ['Add team members to manage your bench', true],
                    ['Send invitations to professionals directly', true],
                    ['Public firm profile page (optional)', true],
                    ['Flat rate — no per-seat fees', true],
                    ['Priority support', true],
                  ].map(([item, blue]) => (
                    <li key={item as string} className="flex items-start gap-3">
                      <Check blue={blue as boolean} />
                      <span className="text-slate-700 text-sm">{item as string}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/join"
                    className="flex-1 text-center rounded-2xl bg-blue-600 text-white px-6 py-3 text-sm font-medium hover:bg-blue-700 transition-colors shadow"
                  >
                    Start Firm Workspace
                  </Link>
                  <DemoRequestButton />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Feature Comparison</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-slate-600 font-medium w-1/2">Feature</th>
                    <th className="px-6 py-4 text-slate-600 font-medium text-center">Individual</th>
                    <th className="px-6 py-4 text-blue-700 font-semibold text-center">Firm Workspace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Verified profile', true, true],
                    ['Directory search & filters', true, true],
                    ['Direct messaging', true, true],
                    ['Connection requests', true, true],
                    ['Mentorship access', true, true],
                    ['Job applications', true, true],
                    ['Post jobs to the talent pool', false, true],
                    ['Private professional bench', false, true],
                    ['Team member access', false, true],
                    ['Categorize by specialty', false, true],
                    ['Send invitations', false, true],
                    ['Public firm profile', false, true],
                    ['Flat-rate monthly billing', '—', '$30/mo'],
                  ].map(([feature, individual, firm]) => (
                    <tr key={feature as string}>
                      <td className="px-6 py-3 text-slate-700">{feature as string}</td>
                      <td className="px-6 py-3 text-center">
                        {individual === true ? (
                          <span className="text-emerald-500">✓</span>
                        ) : individual === false ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <span className="text-slate-500">{individual as string}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {firm === true ? (
                          <span className="text-blue-500 font-medium">✓</span>
                        ) : (
                          <span className="text-blue-600 font-medium">{firm as string}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to get started?</h2>
            <p className="text-slate-600 mb-8">
              Join thousands of CPAs, EAs, and tax preparers who use TaxProExchange to find trusted colleagues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/join"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
              >
                Join Free
              </Link>
              <Link
                href="/for-firms"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Learn about Firm Workspace
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
