'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';



export default function TermsPage() {
  const lastUpdated = '2025-01-27';
  
  // Set page title
  useEffect(() => {
    document.title = 'Terms of Use — TaxProExchange';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-8"
        >
          <div className="prose prose-slate max-w-none">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms of Use</h1>
            <p className="text-slate-600 mb-8">
              Last updated: {lastUpdated}
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-700 mb-4">
              By accessing and using TaxProExchange (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-slate-700 mb-4">
              TaxProExchange is a professional networking platform designed for tax professionals including CPAs, Enrolled Agents (EAs), CTEC registered preparers, and other qualified tax professionals. The Service facilitates professional connections, collaboration opportunities, and knowledge sharing within the tax community.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. User Eligibility</h2>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li>You must be at least 18 years old to use this Service</li>
              <li>You must be a qualified tax professional with valid credentials</li>
              <li>You must provide accurate and truthful information about your qualifications</li>
              <li>You are responsible for maintaining the security of your account</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Acceptable Use</h2>
            <p className="text-slate-700 mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Post false, misleading, or fraudulent information</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Use the Service for commercial purposes without authorization</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">5. Professional Standards</h2>
            <p className="text-slate-700 mb-4">
              As a tax professional, you agree to maintain the highest ethical standards and comply with all applicable professional regulations and licensing requirements in your jurisdiction.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">6. Disclaimers</h2>
            <p className="text-slate-700 mb-4">
              The Service is provided &quot;as is&quot; without warranties of any kind. TaxProExchange does not guarantee the accuracy, completeness, or usefulness of any information on the platform. We are not responsible for any professional advice or services provided by users.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">7. Limitation of Liability</h2>
            <p className="text-slate-700 mb-4">
              TaxProExchange shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">8. Termination</h2>
            <p className="text-slate-700 mb-4">
              We may terminate or suspend your access to the Service at any time, with or without cause, with or without notice, effective immediately.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">9. Changes to Terms</h2>
            <p className="text-slate-700 mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of the Service after changes become effective constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">10. Contact Information</h2>
            <p className="text-slate-700 mb-4">
              If you have any questions about these Terms of Use, please contact us at:{' '}
              <a href="mailto:info@cardifftax.com" className="text-slate-600 hover:text-slate-800 underline">
                info@cardifftax.com
              </a>
            </p>

            <div className="mt-12 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 text-center">
                These terms constitute the entire agreement between you and TaxProExchange regarding the use of the Service.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
