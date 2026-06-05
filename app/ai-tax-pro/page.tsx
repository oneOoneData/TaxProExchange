import { Metadata } from 'next';
import Link from 'next/link';
import AppNavigation from '@/components/AppNavigation';
import Footer from '@/components/Footer';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'The AI Tax Pro — Build an AI-Augmented Tax Practice | TaxProExchange',
  description: 'A complete system for solo preparers and small firms to run like a ten-person practice using AI. Six articles, ready-to-use prompt templates, and free lead magnets.',
  alternates: { canonical: `${siteUrl}/ai-tax-pro` },
  openGraph: {
    title: 'The AI Tax Pro — Free Series for Tax Professionals',
    description: 'Six systems. Ready-to-use AI prompts. Free lead magnets. Build an AI-augmented tax practice without hiring.',
    url: `${siteUrl}/ai-tax-pro`,
    type: 'website',
    images: [{ url: '/images/ai-tax-pro-og.jpg', width: 1200, height: 630, alt: 'The AI Tax Pro — Free Series' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The AI Tax Pro — Free Series for Tax Professionals',
    description: 'Six systems. Ready-to-use AI prompts. Free lead magnets. Build an AI-augmented tax practice without hiring.',
    images: ['/images/ai-tax-pro-og.jpg'],
  },
};

const systems = [
  {
    id: 'second-brain',
    title: 'Build a Second Brain',
    tagline: 'An AI assistant that actually knows your practice',
    description: 'Stop re-onboarding your AI every morning. Build a memory file, skills, and a learning loop so your drafts come back closer to done.',
    icon: '🧠',
    color: 'from-violet-500 to-purple-600',
    slug: 'ai-tax-pro-second-brain',
  },
  {
    id: 'toolkit',
    title: 'The Toolkit',
    tagline: 'Tools worth your time in 2026',
    description: 'Organized by the job you are trying to do, not by hype. Research, document handling, planning, and prep — with a vetting framework that protects your practice.',
    icon: '🛠️',
    color: 'from-blue-500 to-cyan-600',
    slug: 'ai-tax-pro-toolkit',
  },
  {
    id: 'front-desk',
    title: 'Your AI Front Desk',
    tagline: 'A 24/7 receptionist that never misses a lead',
    description: 'Voice AI that answers every call, qualifies the lead, and books the consult while you are heads-down in a return.',
    icon: '📞',
    color: 'from-emerald-500 to-teal-600',
    slug: 'ai-tax-pro-front-desk',
  },
  {
    id: 'marketing-engine',
    title: 'The Marketing Engine',
    tagline: 'Content, social, and a website that stay alive',
    description: 'Turn one client answer into five pieces of content. Batch a month of posts in an hour. Stay visible without becoming a marketer.',
    icon: '📢',
    color: 'from-amber-500 to-orange-600',
    slug: 'ai-tax-pro-marketing-engine',
  },
  {
    id: 'full-automation',
    title: 'Fully Automated Practice',
    tagline: 'Stitch it together with agents',
    description: 'When your tools stop being apps you open and start being a system that runs. The frontier — and how to get there without breaking anything.',
    icon: '⚡',
    color: 'from-rose-500 to-pink-600',
    slug: 'ai-tax-pro-full-automation',
  },
];

export default function AITaxProLanding() {
  return (
    <>
      <AppNavigation />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm mb-6">
              <span>Free 6-part series</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              The AI Tax Pro
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-4 font-medium">
              How a solo preparer can run like a ten-person firm
            </p>
            <p className="text-lg text-slate-400 max-w-3xl mb-10 leading-relaxed">
              You don&apos;t have a staffing problem. You have a <em className="text-slate-200">leverage</em> problem.
              AI is the first tool that fixes it without hiring. This series gives you
              the systems, the prompts, and the playbook — not the hype.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <a href="#start-free" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/25">
                Get Free Lead Magnets
              </a>
              <a href="#the-system" className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg transition-all border border-white/20">
                Explore the Series
              </a>
            </div>

            {/* Trust bar */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-sm text-slate-500 mb-3">Built on two guardrails</p>
              <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  You own every professional conclusion
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Client data never touches tools that violate §7216 or your WISP
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Author credibility */}
        <section className="border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                KB
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Built by a practicing tax pro</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  These systems aren&apos;t theory. They&apos;re what I use in my own firm every day — built from
                  real client work, not marketing white papers. Every prompt, template, and workflow
                  here has been tested against actual returns, notices, and client conversations.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="start-free" className="border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-3xl font-bold text-white mb-4">Start free. Stay sharp.</h2>
            <p className="text-slate-400 mb-10 max-w-2xl">
              Grab both lead magnets before you dive into the series. One gives you a
              real AI workflow you can run today. The other keeps you out of compliance trouble.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <a href="/ai-tax-pro/irs-notice-assistant" className="group block p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all">
                <div className="text-3xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  IRS Notice Response Assistant
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  A ready-to-use AI system prompt + skill template. Drop it into ChatGPT,
                  Claude, or Gemini and respond to IRS notices in minutes instead of hours.
                </p>
                <span className="text-sm text-blue-400 font-medium">Download free →</span>
              </a>

              <a href="/ai-tax-pro/security-cheat-sheet" className="group block p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all">
                <div className="text-3xl mb-4">🛡️</div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  AI Data-Security Cheat Sheet
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Ten questions to ask before any AI tool touches client data. Covers §7216,
                  WISP requirements, encryption standards, and data retention.
                </p>
                <span className="text-sm text-emerald-400 font-medium">Download free →</span>
              </a>
            </div>
          </div>
        </section>

        {/* The Hub Article */}
        <section className="border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="max-w-3xl">
              <span className="text-blue-400 text-sm font-medium">Start here</span>
              <h2 className="text-3xl font-bold text-white mt-2 mb-4">
                The AI Tax Pro — How a solo preparer can run like a ten-person firm
              </h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                The math of a small tax practice has always been brutal. Your revenue is capped
                by the hours you can bill, and a punishing share of those hours never touches a
                return. Here&apos;s the playbook for changing that — with AI, not hiring.
              </p>
              <Link
                href="/insights/ai-tax-pro-hub"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
              >
                Read the hub article →
              </Link>
            </div>
          </div>
        </section>

        {/* The Five Systems */}
        <section id="the-system" className="border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-3xl font-bold text-white mb-4">The five systems</h2>
            <p className="text-slate-400 mb-10 max-w-2xl">
              Build them one at a time. Each article includes a ready-to-use prompt template
              so you walk away with something you can run today.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systems.map((sys) => (
                <Link
                  key={sys.id}
                  href={`/insights/${sys.slug}`}
                  className="group block p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${sys.color} mb-4`}>
                    <span className="text-lg">{sys.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
                    {sys.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">{sys.tagline}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {sys.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Block */}
        <section className="border-t border-white/10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to build your AI tax practice?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Start with the free lead magnets, then work through the series one
              system at a time. By the end of a week, you will have a practice that
              runs differently.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/ai-tax-pro/irs-notice-assistant" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all">
                Get the IRS Notice Assistant
              </a>
              <a href="/ai-tax-pro/security-cheat-sheet" className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg transition-all border border-white/20">
                Get the Security Cheat Sheet
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
