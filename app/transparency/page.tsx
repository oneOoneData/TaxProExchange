'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TransparencyPage() {
  useEffect(() => {
    document.title = 'Site Transparency — TaxProExchange';
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
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Site Transparency</h1>
            <p className="text-slate-600 mb-8">
              Complete transparency about how TaxProExchange operates
            </p>

            <div className="bg-slate-50 p-6 rounded-xl mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mt-0 mb-4">At a Glance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-slate-700 mb-1">Domain</div>
                  <div className="text-slate-600">taxproexchange.com</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700 mb-1">Registration Status</div>
                  <div className="text-slate-600">Active & Auto-renewing</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700 mb-1">Hosting Provider</div>
                  <div className="text-slate-600">Vercel (US)</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700 mb-1">Authentication</div>
                  <div className="text-slate-600">Clerk (SOC 2 Type II)</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700 mb-1">Database</div>
                  <div className="text-slate-600">Supabase (Postgres + RLS)</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700 mb-1">Security</div>
                  <div className="text-slate-600">HTTPS, RLS, OAuth2</div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">Infrastructure & Security</h2>
            
            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">Hosting & Deployment</h3>
            <p className="text-slate-700 mb-4">
              TaxProExchange is hosted on <strong>Vercel</strong>, a secure and reliable platform with 
              edge network distribution. All traffic is served over <strong>HTTPS</strong> with automatic 
              certificate management and renewal.
            </p>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">Database Security</h3>
            <p className="text-slate-700 mb-4">
              We use <strong>Supabase</strong> (managed PostgreSQL) with <strong>Row Level Security (RLS)</strong> 
              enabled on all tables. This means database-level access controls enforce who can read or write data, 
              independent of application logic.
            </p>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">Authentication</h3>
            <p className="text-slate-700 mb-4">
              User authentication is handled by <strong>Clerk</strong>, a SOC 2 Type II certified provider. 
              We support OAuth2 sign-in via Google and LinkedIn, and all sessions are encrypted and 
              managed server-side.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">Data Practices</h2>
            
            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">What We Collect</h3>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li><strong>Minimal PII:</strong> Business name, professional contact info (email, phone if shared)</li>
              <li><strong>Credentials:</strong> License type, number, and state (verified against official registries)</li>
              <li><strong>Professional details:</strong> Specializations, service areas, firm information</li>
              <li><strong>Usage data:</strong> Login times, search queries, profile views (for platform improvements)</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">What We Don&apos;t Collect</h3>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li>Social Security Numbers</li>
              <li>Bank account or payment information (we don&apos;t process payments)</li>
              <li>Client tax documents or sensitive client data</li>
              <li>Detailed financial records</li>
            </ul>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">Data Location</h3>
            <p className="text-slate-700 mb-4">
              All data is stored in <strong>US-based data centers</strong>. Supabase database instances 
              are hosted in AWS US regions. Vercel serves content from edge locations globally but all 
              sensitive data remains in US storage.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">Email Security</h2>
            <p className="text-slate-700 mb-4">
              We send transactional emails (verification, notifications) via <strong>Resend</strong>. 
              Email security measures include:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li><strong>SPF (Sender Policy Framework):</strong> Enabled to prevent email spoofing</li>
              <li><strong>DKIM (DomainKeys Identified Mail):</strong> Enabled for email authentication</li>
              <li><strong>DMARC (Domain-based Message Authentication):</strong> Configured for email validation</li>
            </ul>
            <p className="text-slate-700 mb-4">
              All emails from TaxProExchange originate from verified <code>@taxproexchange.com</code> addresses. 
              If you receive suspicious emails claiming to be from us, please report them immediately.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">Platform Boundaries</h2>
            <p className="text-slate-700 mb-4">
              TaxProExchange is a <strong>discovery and connection platform</strong>. We explicitly do <em>not</em>:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li>Process payments or financial transactions (no payment processor integration)</li>
              <li>Store or transmit client tax documents (no file storage for client work)</li>
              <li>Provide tax preparation software or practice management tools</li>
              <li>Act as an employer, staffing agency, or referral broker</li>
            </ul>
            <p className="text-slate-700 mb-4">
              All professional engagements, contracts, and file exchanges happen <strong>outside our platform</strong>. 
              We facilitate connections; you manage the work.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">Compliance & Standards</h2>
            
            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">Privacy Regulations</h3>
            <p className="text-slate-700 mb-4">
              We comply with:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li><strong>CCPA/CPRA</strong> (California Consumer Privacy Act / Rights Act)</li>
              <li><strong>GDPR</strong> (for any EU users, though primary audience is US-based tax professionals)</li>
              <li><strong>CAN-SPAM Act</strong> (email marketing compliance)</li>
            </ul>
            <p className="text-slate-700 mb-4">
              See our <a href="/legal/privacy" className="text-slate-900 underline hover:text-slate-700">Privacy Policy</a> for 
              details on data rights, deletion requests, and opt-out procedures.
            </p>

            <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">Professional Standards</h3>
            <p className="text-slate-700 mb-4">
              While TaxProExchange is not a regulated tax firm, we verify professionals against official standards:
            </p>
            <ul className="list-disc pl-6 text-slate-700 mb-4 space-y-2">
              <li><strong>CPA:</strong> State Board of Accountancy verification</li>
              <li><strong>Enrolled Agent:</strong> IRS EA Public Directory</li>
              <li><strong>CTEC:</strong> California Tax Education Council registry</li>
              <li><strong>Attorney:</strong> State Bar association verification</li>
            </ul>
            <p className="text-slate-700 mb-4">
              See our <a href="/trust" className="text-slate-900 underline hover:text-slate-700">Trust & Verification</a> page 
              for details on our verification process.
            </p>

            <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">Contact & Accountability</h2>
            <p className="text-slate-700 mb-4">
              For security concerns, privacy questions, or transparency inquiries:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-slate-700 mb-2">
                <strong>Email:</strong>{' '}
                <a href="mailto:koen@cardifftax.com" className="text-slate-600 hover:text-slate-800 underline">
                  koen@cardifftax.com
                </a>
              </p>
              <p className="text-slate-700 mb-2">
                <strong>Security issues:</strong>{' '}
                <a href="mailto:koen@cardifftax.com" className="text-slate-600 hover:text-slate-800 underline">
                  koen@cardifftax.com
                </a>
              </p>
            </div>

            <div className="mt-12 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-slate-700 text-center mb-2">
                <strong>Commitment to Transparency</strong>
              </p>
              <p className="text-sm text-slate-600 text-center">
                We believe trust is earned through openness. If you have questions about anything on this page, 
                we&apos;re happy to clarify. Transparency isn&apos;t just a page—it&apos;s how we operate.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

