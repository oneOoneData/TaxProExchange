import { Metadata } from 'next';
import Link from 'next/link';
import { siteUrl } from '@/lib/seo';
import AnalyticsPageView from '@/components/analytics/AnalyticsPageView';
import AppNavigation from '@/components/AppNavigation';
import PartnerCard from './components/PartnerCard';
import partnersData from '@/data/partners.json';

export const metadata: Metadata = {
  title: 'Technology Partners | TaxProExchange',
  description: 'Explore our partnerships with forward-looking AI firms transforming tax, accounting, and wealth management. Partner with TaxProExchange to build the future of professional services.',
  alternates: { canonical: `${siteUrl}/partners` },
  openGraph: {
    title: 'Technology Partners | TaxProExchange',
    description: 'Explore our partnerships with forward-looking AI firms transforming tax, accounting, and wealth management.',
    url: `${siteUrl}/partners`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Technology Partners | TaxProExchange',
    description: 'Explore our partnerships with forward-looking AI firms transforming tax, accounting, and wealth management.',
  },
};

export default function PartnersPage() {
  return (
    <>
      <AnalyticsPageView eventName="view_partners" />
      <AppNavigation />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Hero */}
        <section 
          className="relative overflow-hidden bg-slate-900 text-white bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/bg/skyline.png)' }}
        >
          {/* Light Overlay for text readability */}
          <div className="absolute inset-0 bg-slate-900/40" />
          
          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Partnering with the Innovators Shaping the Future of Tax
              </h1>
              <p className="mt-6 text-xl text-slate-300">
                We collaborate with forward-looking AI and fintech companies pushing the boundaries of accounting and wealth management. Together, we bring insights, education, and practical tools to the verified tax professionals on the exchange.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:support@taxproexchange.com?subject=Partnership Inquiry"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-slate-900 bg-white hover:bg-slate-100 shadow-lg transition-all"
                >
                  Become a Partner
                </a>
                <a
                  href="/search"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-slate-700 hover:bg-slate-600 shadow-lg transition-all border border-slate-600"
                >
                  Explore the Network
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Context Section - What Partners Offer */}
        <section className="py-12 bg-white border-b border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                AI-Powered Tools for Modern Tax Professionals
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                TaxProExchange partners with forward-looking fintech and AI companies transforming tax, accounting, and wealth management. Our technology partners provide cutting-edge solutions for workflow automation, research acceleration, and client service enhancement—all vetted for integration with professional tax practices. Explore partner solutions, access exclusive member pricing, and connect directly with product teams who understand the unique needs of CPAs, EAs, and tax preparers.
              </p>
            </div>
          </div>
        </section>

        {/* Why Partner With Us Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Why Partner With TaxProExchange
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-3xl mx-auto">
                TaxProExchange connects verified CPAs, EAs, and tax professionals across the U.S. who are eager to adopt next-generation tools.<br />
                Our platform helps partners share education, research, and product innovations directly with the professionals shaping the future of tax and accounting.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="flex items-start gap-4 p-6 rounded-xl bg-slate-50">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900 mb-2">Reach a verified professional network</h3>
                    <p className="text-sm text-slate-600">Connect with CPAs, EAs, and CTEC professionals across the U.S.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-6 rounded-xl bg-slate-50">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900 mb-2">Co-create educational content</h3>
                    <p className="text-sm text-slate-600">Develop webinars, guides, and case studies together</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-6 rounded-xl bg-slate-50">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900 mb-2">Showcase to early adopters</h3>
                    <p className="text-sm text-slate-600">Present your technology to forward-thinking professionals</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-6 rounded-xl bg-slate-50">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900 mb-2">Build long-term credibility</h3>
                    <p className="text-sm text-slate-600">Establish your presence in the professional tax ecosystem</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partners Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">
                Our Technology Partners
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Innovative AI platforms helping tax professionals work smarter, faster, and more accurately.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {partnersData.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          </div>
        </section>

        {/* Why Partner */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">
                Why Partner with TaxProExchange
              </h2>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Verified Professional Network',
                  desc: 'Every CPA, EA, and tax professional on our platform is manually verified. Connect your technology with practitioners who value trust and quality.',
                },
                {
                  title: 'AI-Forward Community',
                  desc: 'Our members are early adopters embracing AI and modern workflows. They\'re the ideal audience for innovative tax technology.',
                },
                {
                  title: 'Collaborative Ecosystem',
                  desc: 'We believe the future of tax work is built through partnerships. Integrate, co-market, and grow together.',
                },
                {
                  title: 'Shared Values',
                  desc: 'We prioritize transparency, professional excellence, and human-centered AI that augments rather than replaces practitioners.',
                },
              ].map((benefit, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
                  <h3 className="font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Let&apos;s Build Together
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Interested in partnering with TaxProExchange? We&apos;re looking for AI-forward firms building the future of tax, accounting, and wealth management.
            </p>
            <a
              href="mailto:support@taxproexchange.com?subject=Partnership Inquiry"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-slate-900 bg-white hover:bg-slate-100 shadow-lg transition-all"
            >
              Contact Partnerships Team
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

