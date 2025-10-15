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
        <section className="relative overflow-hidden bg-slate-900 text-white">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ backgroundImage: 'url(/bg/skyline.png)' }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/70" />
          
          {/* Content */}
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Building the Future of Tax & Accounting
              </h1>
              <p className="mt-6 text-xl text-slate-300">
                We partner with forward-looking AI firms transforming tax, accounting, and wealth management. Together, we&apos;re creating infrastructure for trusted professional connections and intelligent workflows.
              </p>
              <div className="mt-8">
                <a
                  href="mailto:support@taxproexchange.com?subject=Partnership Inquiry"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-slate-900 bg-white hover:bg-slate-100 shadow-lg transition-all"
                >
                  Become a Partner
                </a>
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

