/**
 * Firms Landing Page - Enterprise Edition
 * 
 * Sober, proof-led landing for larger CPA firms.
 * Gated by FEATURE_FIRM_WORKSPACES flag.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import { withUTM } from './utm';

export const metadata: Metadata = {
  title: 'Firm Workspaces — Build a Trusted Bench of Verified CPAs & EAs | TaxProExchange',
  description:
    'Create a firm workspace, add verified CPAs & EAs to your trusted bench, and scale capacity for busy season—without full-time hires.',
  openGraph: {
    title: 'Firm Workspaces — Build a Trusted Bench of Verified CPAs & EAs',
    description:
      'Verified professionals on demand. Build your trusted bench and flex capacity every busy season.',
    type: 'website',
  },
  alternates: { canonical: '/firms' },
};

const COPY = {
  hero: {
    title: 'Scale your firm without full-time hires',
    sub: 'Verified CPAs & EAs for overflow, reviews, and niche work. Stand up a vetted bench in days, not months.',
    bullets: ['Verified professionals', 'No client PII stored', 'Avg. setup: 3 minutes'],
    ctaPrimary: 'Create Firm Account',
    ctaSecondary: 'Book 15-min Demo',
  },
  kpis: [
    { label: 'Verified profiles', value: '215+' },
    { label: 'Avg. reply time', value: '24h' },
    { label: 'Satisfaction', value: '96%' },
  ],
  logosTitle: 'Trusted by growing firms',
  howTitle: 'How it works',
  how: [
    { num: '1', title: 'Create your firm workspace', body: 'Add firm details, invite teammates, set specialties and states.' },
    { num: '2', title: 'Build your trusted bench', body: 'Search verified pros. Add with custom titles, notes, and priority.' },
    { num: '3', title: 'Collaborate on demand', body: 'Message directly for overflow, reviews, or specialty projects.' },
  ],
  featuresTitle: 'Why firms choose TaxProExchange',
  features: [
    { title: 'Verified professionals', body: 'CPAs, EAs, and licensed preparers only.' },
    { title: 'Organized bench', body: 'Custom titles, notes, categories, and ranking for each pro.' },
    { title: 'Public or private', body: 'Showcase select partners on your firm profile—or keep private.' },
    { title: 'Direct messaging', body: 'Connect fast and keep client work in-house.' },
  ],
  caseStudy: {
    eyebrow: 'Case study',
    title: 'A 12-person firm cut turnarounds by 28% in busy season',
    points: ['2 specialists added to bench', 'No recruiter fees', 'Kept client work in-house'],
    quote: 'We staffed busy season without scrambling—EA for IRS rep and a CPA reviewer in under a week.',
    author: 'Operations Lead, 12-person CPA firm',
  },
  security: [
    { label: 'Identity', value: 'Clerk Auth' },
    { label: 'Data access', value: 'Directory + intros only (no client PII)' },
    { label: 'Hosting', value: 'Vercel' },
    { label: 'DB controls', value: 'Supabase RLS' },
  ],
  finalCTA: {
    title: 'Ready to build your trusted bench?',
    sub: 'Join TaxProExchange and start connecting with verified professionals today.',
    primary: 'Create Firm Account',
    secondary: 'Book 15-min Demo',
    trust: 'HTTPS by Vercel • RLS on Supabase • Clerk Auth',
  },
};

function GridBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.12]"
      viewBox="0 0 1200 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" className="text-gray-300 dark:text-slate-700" />
      <path d="M120,420 C360,260 640,260 880,420" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-blue-400/40" />
      <path d="M200,470 C420,300 720,300 1000,470" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-400/30" />
    </svg>
  );
}

function Hero({ ctaJoin, ctaDemo }: { ctaJoin: string; ctaDemo: string }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Sophisticated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #3b82f6 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #6366f1 0%, transparent 50%)`
        }}
      />
      
      {/* Floating geometric elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-cyan-500/15 rounded-full blur-lg" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          {/* Premium badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm font-medium text-white mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Trusted by 500+ CPA Firms
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Scale Your Firm's
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Capacity Instantly
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Access a curated network of verified CPAs and EAs. Build your trusted bench, 
            scale for busy season, and deliver exceptional client service without the overhead.
          </p>

          {/* Premium CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a
              href={ctaJoin}
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">Start Your Firm Workspace</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href={ctaDemo}
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all duration-300"
            >
              View Live Demo
            </a>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-200 text-sm">Firms Using TPE</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">$2.1M</div>
              <div className="text-blue-200 text-sm">Avg. Revenue Impact</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">48hr</div>
              <div className="text-blue-200 text-sm">Avg. Match Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating dashboard preview */}
      <div className="absolute bottom-10 right-10 w-80 h-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-4 hidden lg:block">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-red-400 rounded-full" />
          <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          <div className="w-3 h-3 bg-green-400 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded w-3/4" />
          <div className="h-2 bg-gray-200 rounded w-1/2" />
          <div className="h-2 bg-blue-200 rounded w-2/3" />
        </div>
      </div>
    </section>
  );
}

function KPIBand() {
  return (
    <section className="py-16 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Real results from firms that chose TaxProExchange
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {COPY.kpis.map((k, index) => (
            <div key={k.label} className="group text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className={`w-16 h-16 bg-gradient-to-br ${
                index === 0 ? 'from-blue-500 to-blue-600' :
                index === 1 ? 'from-green-500 to-green-600' :
                'from-purple-500 to-purple-600'
              } rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl font-bold text-white">{k.value}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{k.label}</div>
              <div className="text-gray-600 dark:text-gray-400">
                {index === 0 ? 'From boutique to Big 4' :
                 index === 1 ? 'Per firm annually' :
                 'From request to start'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Logos() {
  const logos = ['/brands/brand1.svg', '/brands/brand2.svg', '/brands/brand3.svg', '/brands/brand4.svg', '/brands/brand5.svg'];
  return (
    <section className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-4">
            {COPY.logosTitle}
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
          {logos.map((src, index) => (
            <div 
              key={src} 
              className="group flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <img 
                src={src} 
                alt={`Partner ${index + 1}`} 
                className="h-10 w-auto mx-auto opacity-60 group-hover:opacity-100 transition-opacity duration-300 filter grayscale group-hover:grayscale-0" 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">{COPY.howTitle}</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {COPY.how.map((s) => (
          <div key={s.num} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.num}</div>
            <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{s.title}</div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">{COPY.featuresTitle}</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {COPY.features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-6">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{f.title}</div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CaseStudy() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-8 md:p-10">
        <div className="text-sm uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
          {COPY.caseStudy.eyebrow}
        </div>
        <h3 className="mt-2 text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{COPY.caseStudy.title}</h3>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {COPY.caseStudy.points.map((pt) => (
            <li key={pt} className="flex items-start gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{pt}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xl leading-relaxed text-gray-900 dark:text-gray-100">"{COPY.caseStudy.quote}"</p>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium">— {COPY.caseStudy.author}</div>
      </div>
    </section>
  );
}

function SecurityRow() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-6 md:grid-cols-4">
        {COPY.security.map((s) => (
          <div key={s.label}>
            <div className="text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
            <div className="font-medium text-gray-900 dark:text-gray-100 mt-1">{s.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA({ ctaJoin, ctaDemo }: { ctaJoin: string; ctaDemo: string }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-6 pb-20">
      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8 md:p-10">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{COPY.finalCTA.title}</h3>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{COPY.finalCTA.sub}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={ctaJoin}
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
          >
            {COPY.finalCTA.primary}
          </a>
          <a
            href={ctaDemo}
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
          >
            {COPY.finalCTA.secondary}
          </a>
        </div>
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">{COPY.finalCTA.trust}</div>
      </div>
    </section>
  );
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FirmsPage({ searchParams }: PageProps) {
  if (!FEATURE_FIRM_WORKSPACES) {
    return notFound();
  }

  const params = await searchParams;

  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (Array.isArray(v)) sp.set(k, v[0] ?? '');
    else if (v) sp.set(k, v);
  });

  const joinUrl = withUTM('/join?mode=firm', sp);
  const demoUrl = withUTM('/book-demo', sp);

  return (
    <main className="bg-white dark:bg-slate-950">
      <Hero ctaJoin={joinUrl} ctaDemo={demoUrl} />
      <KPIBand />
      <Logos />
      <HowItWorks />
      <FeatureGrid />
      <CaseStudy />
      <SecurityRow />
      <FinalCTA ctaJoin={joinUrl} ctaDemo={demoUrl} />
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Firm Workspaces — TaxProExchange',
            description:
              'Create a firm workspace, add verified CPAs & EAs to your trusted bench, and scale capacity without full-time hires.',
            url: 'https://taxproexchange.com/firms',
            provider: {
              '@type': 'Organization',
              name: 'TaxProExchange',
              url: 'https://taxproexchange.com',
            },
          }),
        }}
      />
    </main>
  );
}
