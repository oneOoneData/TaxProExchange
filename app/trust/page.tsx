'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Script from 'next/script';
import LiveCounters from '@/components/Trust/LiveCounters';
import BadgeLegend from '@/components/Trust/BadgeLegend';
import LookupLinks from '@/components/Trust/LookupLinks';
import BuiltWith from '@/components/Trust/BuiltWith';

export default function TrustPage() {
  useEffect(() => {
    document.title = 'Trust & Verification — TaxProExchange';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            How TaxProExchange Verifies Professionals
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Trust and transparency are the foundation of our platform. Here&rsquo;s exactly how we verify credentials and maintain professional standards.
          </p>
        </motion.div>

        {/* Live Stats */}
        <div className="mb-12">
          <LiveCounters />
        </div>

        {/* Verification Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 border border-slate-200 mb-12"
        >
          <h2 className="text-3xl font-semibold text-slate-900 mb-6">
            Our Verification Process
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  License Checks Against Official Registries
                </h3>
                <p className="text-slate-600">
                  We verify CPA licenses through State Boards of Accountancy, Enrolled Agents through the IRS EA Directory, 
                  CTEC preparers through the California Tax Education Council, and attorneys through State Bar associations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Manual Review with Evidence Screenshots
                </h3>
                <p className="text-slate-600">
                  Our team manually reviews each credential submission. We take screenshots from official registries and 
                  store them internally as proof of verification. No automated-only verification here.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Fast Takedown if Flagged with Credible Evidence
                </h3>
                <p className="text-slate-600">
                  If a listing is reported with credible evidence of fraudulent credentials or misconduct, we investigate 
                  immediately and can remove profiles within 24 hours pending review.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Only Verified + Opted-In Profiles Are Publicly Listed
                </h3>
                <p className="text-slate-600">
                  Professionals must pass verification <em>and</em> explicitly opt-in to public listing. 
                  We respect privacy and don&rsquo;t list anyone without their consent.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Badge Legend */}
        <div className="mb-12">
          <BadgeLegend />
        </div>

        {/* Lookup Links */}
        <div className="mb-12">
          <LookupLinks />
        </div>

        {/* Built With */}
        <div className="mb-12">
          <BuiltWith />
        </div>

        {/* What We Don't Do */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-50 rounded-2xl p-8 border border-slate-200 mb-12"
        >
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            What We Don&rsquo;t Do
          </h2>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>No payment processing:</strong> We don&rsquo;t handle money or take a cut of your transactions. Connect and negotiate directly.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>No client file exchange in-app:</strong> We&rsquo;re a discovery and connection platform, not a file-sharing or practice management system.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>No automated-only verification:</strong> Every credential is reviewed by a human to prevent fraud.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>No selling your data:</strong> We never sell your information to third parties. See our <a href="/legal/privacy" className="text-slate-900 underline hover:text-slate-700">Privacy Policy</a>.</span>
            </li>
          </ul>
        </motion.div>

        {/* Data Minimization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-8 border border-slate-200 mb-12"
        >
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Data Minimization & Privacy
          </h2>
          <p className="text-slate-700 mb-4">
            We only collect what&rsquo;s necessary for verification and professional networking:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700">
            <li>Credential type and license number (verified against official sources)</li>
            <li>Professional name, firm name, and contact information (only if you opt to share publicly)</li>
            <li>Service areas and specializations (for search and matching)</li>
          </ul>
          <p className="text-slate-600 mt-4">
            We do <strong>not</strong> require Social Security Numbers, bank account details, or sensitive client information. 
            Your verification evidence (license screenshots) is stored securely and never shared publicly.
          </p>
        </motion.div>

        {/* Reporting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border-2 border-red-200"
        >
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Report a Profile
          </h2>
          <p className="text-slate-700 mb-6">
            If you believe a profile contains fraudulent credentials, misleading information, or violates our terms, 
            please report it immediately. We take all reports seriously and investigate within 24 hours.
          </p>
          <a
            href="mailto:support@taxproexchange.com?subject=Report%20a%20profile"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            📧 Report via Email
          </a>
          <p className="text-sm text-slate-600 mt-4">
            Please include the profile URL and a description of the issue. Evidence (screenshots, links to official registries) helps us act faster.
          </p>
        </motion.div>

        {/* FAQ Schema */}
        <Script
          id="faq-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How does TaxProExchange verify credentials?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We verify CPA licenses through State Boards of Accountancy, Enrolled Agents through the IRS EA Directory, CTEC preparers through the California Tax Education Council, and attorneys through State Bar associations. Each credential is manually reviewed by our team with evidence screenshots stored internally.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What badges do you use?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We display badges for Verified (✓), CPA (🎓), EA (📋), CTEC (📊), Attorney (⚖️), and Pending (🔍) verification status. Each badge represents verification against official state or federal registries.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I report a fraudulent profile?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Email support@taxproexchange.com with the subject "Report a profile" and include the profile URL and description of the issue. We investigate all reports within 24 hours and can remove profiles pending review.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Do you sell my data?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No, we never sell your information to third parties. We only collect what is necessary for verification and professional networking. See our Privacy Policy for details.',
                  },
                },
              ],
            }),
          }}
        />
      </div>
    </div>
  );
}

