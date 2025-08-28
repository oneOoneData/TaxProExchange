'use client';

import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { JoinButton } from '@/components/JoinButton';

export const dynamic = 'force-dynamic';

export default function Page() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect to profile edit if user is signed in
  useEffect(() => {
    if (user && isLoaded) {
      router.push('/profile/edit');
    }
  }, [user, isLoaded, router]);

  // Redirect to profile edit if user is signed in
  useEffect(() => {
    if (user && isLoaded) {
      router.push('/profile/edit');
    }
  }, [user, isLoaded, router]);
  const features = [
    {
      title: 'Verified Professionals',
      desc: 'CPA, EA, and CTEC IDs checked before profiles go live. Trust is the default.'
    },
    {
      title: 'Smart Discovery',
      desc: 'Find pros by credential, state, specialization, and availability.'
    },
    {
      title: 'Handoff-Ready',
      desc: 'Connect for overflow work, review & sign-off, or IRS representation — payments handled offline.'
    },
  ];

  const steps = [
    { n: '1', title: 'Join & Sign In', desc: 'Sign in with Google to get started.'},
    { n: '2', title: 'Create Profile', desc: 'Set up your professional profile with credentials and specializations.'},
    { n: '3', title: 'Connect & Collaborate', desc: 'Search, filter, and message other professionals. Handle scope and payment off-platform.'},
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">TX</span>
            <span className="font-semibold text-slate-900">TaxProExchange</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
            <a href="/search" className="hover:text-slate-900">Search</a>
            <a href="/join" className="hover:text-slate-900">Join</a>
            {user && (
              <a href="/profile/edit" className="hover:text-slate-900">My Profile</a>
            )}
          </nav>
          <JoinButton />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 md:pt-24 md:pb-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
                Where Tax Professionals
                <span className="block">Connect and Collaborate</span>
              </h1>
              <p className="mt-4 text-slate-600 text-lg">
                A trusted directory for CPAs, EAs, and CTEC preparers to find each other for
                handoffs, overflow work, and representation. No payments or file exchange — just
                verified connections.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a href="/join" className="rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-medium shadow hover:shadow-md">
                  Join Now
                </a>
                <a href="#features" className="rounded-2xl bg-white text-slate-900 border border-slate-200 px-5 py-3 text-sm font-medium hover:bg-slate-50">
                  See how it works
                </a>
              </div>
              <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Manual credential checks</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Free to list during beta</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
              <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Example search</div>
                <div className="rounded-xl border bg-slate-50 p-3 text-sm">CPA • California • S-Corp Reviews • Accepting work</div>
                <ul className="mt-4 space-y-3">
                  {[
                    { name: 'Jordan C., CPA', tag: 'S-Corp / Multi-State', state: 'CA', verified: true },
                    { name: 'Maya R., EA', tag: 'IRS Representation', state: 'TX', verified: true },
                    { name: 'Leo P., CTEC', tag: '1040 + Sched C', state: 'CA', verified: true },
                  ].map((p, i) => (
                    <li key={i} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {p.name}
                          {p.verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Verified</span>}
                        </div>
                        <div className="text-sm text-slate-500">{p.tag} • {p.state}</div>
                      </div>
                      <button className="text-sm rounded-xl border px-3 py-2 hover:bg-slate-50">Connect</button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-xs text-slate-500">*Profiles shown are illustrative.</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logos / social proof (optional placeholders) */}
      <section className="py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
            Built by tax pros, for tax pros. Join now to create your professional profile.
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-slate-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <div key={i} className="rounded-2xl border p-6">
                  <div className="text-slate-400 text-sm">Step {s.n}</div>
                  <div className="mt-1 font-semibold text-slate-900">{s.title}</div>
                  <div className="mt-2 text-slate-600 text-sm">{s.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <a href="/join" className="inline-block rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-medium shadow hover:shadow-md">Join Now</a>
            </div>
          </div>
        </div>
      </section>

      {/* Join CTA Section */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-6"
          >
            Ready to Connect?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto"
          >
            Join TaxProExchange today and start building your professional network. 
            Create your profile, get verified, and connect with other tax professionals.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="/join"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all"
            >
              Join Now
            </a>
            <a
              href="#features"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-semibold text-slate-900">FAQ</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-slate-900">Do you process payments or hold funds?</h4>
                <p className="mt-2 text-sm text-slate-600">No. TaxProExchange is a connection-only platform. Professionals handle contracts and payments off-platform.</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">How do you verify credentials?</h4>
                <p className="mt-2 text-sm text-slate-600">During beta we manually check state CPA boards, IRS EA enrollment, and CTEC registration before profiles are visible.</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Is it free?</h4>
                <p className="mt-2 text-sm text-slate-600">Yes during beta. Later we may offer featured listings and optional subscriptions.</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Can clients use this?</h4>
                <p className="mt-2 text-sm text-slate-600">This is built for professionals only: CPAs, EAs, and registered preparers who need collaboration and referrals.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">TX</span>
              <span>© {new Date().getFullYear()} TaxProExchange</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-900">Privacy</a>
              <a href="#" className="hover:text-slate-900">Terms</a>
              <a href="/join" className="hover:text-slate-900">Join Now</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
