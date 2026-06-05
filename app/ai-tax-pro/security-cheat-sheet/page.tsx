import { Metadata } from 'next';
import Link from 'next/link';
import AppNavigation from '@/components/AppNavigation';
import Footer from '@/components/Footer';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'AI Data-Security Cheat Sheet — Free Checklist | TaxProExchange',
  description: 'Ten questions to ask before any AI tool touches client data. Covers §7216, WISP requirements, encryption, and data retention for tax professionals.',
  alternates: { canonical: `${siteUrl}/ai-tax-pro/security-cheat-sheet` },
  openGraph: {
    title: 'AI Data-Security Cheat Sheet — Free Checklist for Tax Pros',
    description: 'Vet any AI tool against §7216 and WISP requirements in 10 questions.',
    url: `${siteUrl}/ai-tax-pro/security-cheat-sheet`,
    type: 'website',
  },
};

export default function SecurityCheatSheet() {
  return (
    <>
      <AppNavigation />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link href="/ai-tax-pro" className="hover:text-slate-900">The AI Tax Pro</Link>
            <span>→</span>
            <span className="text-slate-900">AI Data-Security Cheat Sheet</span>
          </nav>

          <header className="mb-10">
            <div className="text-4xl mb-4">🛡️</div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              AI Data-Security Cheat Sheet
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              Ten questions to vet any AI tool before client data gets anywhere near it.
              Covers §7216, your WISP, encryption, data retention, and vendor diligence.
            </p>
          </header>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-10">
            <h3 className="text-lg font-semibold text-amber-900 mt-0 mb-2">⚠ Why this matters</h3>
            <p className="text-amber-800 text-sm mb-2">
              Under <strong>§7216</strong>, tax preparers face up to $1,000 per violation plus criminal
              penalties for unauthorized disclosure of tax return information. Your
              <strong>Written Information Security Plan (WISP)</strong> is a legal obligation in most states.
            </p>
            <p className="text-amber-800 text-sm mb-0">
              &ldquo;I pasted it into ChatGPT&rdquo; is not a defense. These ten questions
              close that gap.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                q: 'Does the tool have a business or enterprise tier with data-retention controls?',
                why: 'Consumer tiers often train on your inputs. Business tiers typically exclude your data from training and let you set retention policies. If the tool only offers a free tier, assume your data trains the model.',
              },
              {
                q: 'Where is the data stored and processed?',
                why: 'US-based storage is preferred. Cross-border data flows create additional compliance obligations. Ask for the data center region and whether sub-processors are used.',
              },
              {
                q: 'Does the tool offer SOC 2, ISO 27001, or equivalent certification?',
                why: 'These certifications mean an independent auditor has verified the vendor&apos;s security controls. If they don&apos;t have one, ask for their security white paper or pen test results.',
              },
              {
                q: 'Is data encrypted at rest and in transit?',
                why: 'TLS 1.2+ for transit, AES-256 for at rest. Should be standard, but confirm it in writing. If they hesitate or can&apos;t describe their encryption, that&apos;s your answer.',
              },
              {
                q: 'Can you delete client data on demand, and is deletion verifiable?',
                why: 'Your WISP requires secure disposal when data is no longer needed. The tool should let you delete data and confirm it&apos;s gone from all systems including backups within a defined window.',
              },
              {
                q: 'Does the tool allow you to audit access logs?',
                why: 'Who accessed what, when, and from where. If you can&apos;t audit access, you can&apos;t detect a breach. Some vendors charge extra for this — budget for it.',
              },
              {
                q: 'What happens to your data if you cancel or the vendor shuts down?',
                why: 'Get the data export and deletion process in writing before you sign. If the vendor goes under, you need to know your data won&apos;t end up in an asset sale.',
              },
              {
                q: 'Does the tool have a published vulnerability disclosure or bug bounty program?',
                why: 'A sign that security is taken seriously internally. If they don&apos;t have one, they may not be finding or fixing vulnerabilities proactively.',
              },
              {
                q: 'Can the tool integrate without exposing API keys or credentials in logs?',
                why: 'Secret sprawl is a common breach vector. The tool should support secure credential storage and not log sensitive fields.',
              },
              {
                q: 'Does the vendor provide a signed BAA or DPA?',
                why: 'A Business Associate Agreement (HIPAA) or Data Processing Agreement (GDPR) governs how they handle data on your behalf. For tax data, get something equivalent in writing even if HIPAA doesn&apos;t directly apply — the standard matters.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">{item.q}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-slate-900 text-white rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">Quick decision rule</h3>
            <p className="text-slate-300 mb-6 leading-relaxed">
              If a tool gets <strong className="text-white">7 or more &ldquo;yes&rdquo; answers</strong>, it passes basic diligence
              for non-sensitive use. For anything touching tax return information,
              you want <strong className="text-white">9 or 10</strong> — and you still de-identify before input.
            </p>
            <p className="text-slate-400 text-sm">
              Fewer than 7? Either the tool isn&apos;t enterprise-ready, or the vendor isn&apos;t
              transparent enough to trust with client data. Move on.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-center">
            <p className="text-slate-600 mb-4">Use this with every tool in the series</p>
            <Link
              href="/insights/ai-tax-pro-toolkit"
              className="inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all"
            >
              Read the Toolkit article →
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
