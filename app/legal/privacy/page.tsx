'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';



export default function PrivacyPage() {
  const lastUpdated = '2025-01-27';
  
  // Set page title
  useEffect(() => {
    document.title = 'Privacy Policy — TaxProExchange';
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
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
            <p className="text-slate-600 mb-8">
              Last updated: {lastUpdated}
            </p>

            <p className="text-slate-700 mb-6">
              TaxProExchange (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our professional networking platform.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">1.1 Account Information</h3>
            <p className="text-slate-700 mb-4">
              When you create an account, we collect information through our authentication provider (Clerk), including:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li>Name and email address</li>
              <li>Profile picture (if provided)</li>
              <li>Authentication method (Google, LinkedIn, etc.)</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">1.2 Profile Information</h3>
            <p className="text-slate-700 mb-4">
              You may provide additional professional information including:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li>Professional credentials and licenses</li>
              <li>Firm information and contact details</li>
              <li>Specializations and expertise areas</li>
              <li>Geographic location and service areas</li>
              <li>Professional biography and experience</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">1.3 Usage and Technical Data</h3>
            <p className="text-slate-700 mb-4">
              We automatically collect certain information when you use our service:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li>IP address and device information</li>
              <li>Browser type and operating system</li>
              <li>Pages visited and features used</li>
              <li>Search queries and interactions</li>
              <li>Error logs and performance data</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-slate-700 mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our networking platform</li>
              <li><strong>Authentication:</strong> To verify your identity and secure your account</li>
              <li><strong>Professional Matching:</strong> To connect you with other tax professionals</li>
              <li><strong>Communication:</strong> To send important service updates and notifications</li>
              <li><strong>Safety and Compliance:</strong> To prevent fraud, abuse, and ensure compliance with our terms</li>
              <li><strong>Analytics:</strong> To understand usage patterns and improve user experience</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. Information Sharing and Disclosure</h2>
            <p className="text-slate-700 mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:</p>
            
            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">3.1 Service Providers</h3>
            <p className="text-slate-700 mb-4">
              We work with trusted third-party service providers who assist us in operating our platform:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li><strong>Vercel:</strong> Hosting and infrastructure services</li>
              <li><strong>Supabase:</strong> Database and backend services</li>
              <li><strong>Clerk:</strong> Authentication and user management</li>
              <li><strong>Resend:</strong> Email delivery services</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">3.2 Legal Requirements</h3>
            <p className="text-slate-700 mb-4">
              We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety.
            </p>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">3.3 Professional Networking</h3>
            <p className="text-slate-700 mb-4">
              Your profile information (excluding contact details) may be visible to other registered users to facilitate professional connections.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-slate-700 mb-4">
              We implement reasonable security measures to protect your personal information, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">5. Data Retention</h2>
            <p className="text-slate-700 mb-4">
              We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time. We may retain certain information for legal, regulatory, or business purposes.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">6. Your Rights and Choices</h2>
            <p className="text-slate-700 mb-4">Depending on your location, you may have certain rights regarding your personal information:</p>
            
            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">6.1 California Residents (CCPA/CPRA)</h3>
            <p className="text-slate-700 mb-4">
              California residents have the right to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li>Know what personal information we collect and how we use it</li>
              <li>Request deletion of your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Opt-out of the sale or sharing of personal information</li>
            </ul>
            <p className="text-slate-700 mb-4">
              <strong>Important:</strong> We do not sell your personal information to third parties.
            </p>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">6.2 General Rights</h3>
            <p className="text-slate-700 mb-4">
              All users can:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li>Access and update your profile information</li>
              <li>Control your privacy settings and visibility</li>
              <li>Request deletion of your account</li>
              <li>Opt-out of non-essential communications</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">7. Cookies and Tracking</h2>
            <p className="text-slate-700 mb-4">
              We use essential cookies and similar technologies to provide our service, authenticate users, and improve functionality. We do not use tracking cookies for advertising purposes.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">8. Children&rsquo;s Privacy</h2>
            <p className="text-slate-700 mb-4">
              Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">9. International Data Transfers</h2>
            <p className="text-slate-700 mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">10. Changes to This Policy</h2>
            <p className="text-slate-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the &quot;Last updated&quot; date.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">11. Contact Us</h2>
            <p className="text-slate-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-slate-700 mb-2">
                <strong>Email:</strong>{' '}
                <a href="mailto:support@taxproexchange.com" className="text-slate-600 hover:text-slate-800 underline">
                  support@taxproexchange.com
                </a>
              </p>
              <p className="text-slate-700">
                <strong>Business Address:</strong> TaxProExchange, [Your Business Address]
              </p>
            </div>

            <div className="mt-12 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 text-center">
                This Privacy Policy is effective as of {lastUpdated} and applies to all users of TaxProExchange.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
