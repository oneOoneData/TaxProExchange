'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Page() {
  const [email, setEmail] = useState('');
  const [roleInterest, setRoleInterest] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Form submission prevented, handling with JavaScript');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      if (roleInterest) formData.append('role_interest', roleInterest);
      if (notes) formData.append('notes', notes);

      console.log('Submitting form with email:', email);

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      if (data.success && data.redirectUrl) {
        console.log('Redirecting to:', data.redirectUrl);
        // Use router.push for better navigation, or fallback to window.location
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to join waitlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    { n: '1', title: 'Join the waitlist', desc: 'Tell us who you are and what you need (or offer).'},
    { n: '2', title: 'Get verified', desc: 'We manually check license/credential numbers for trust.'},
    { n: '3', title: 'Connect & collaborate', desc: 'Search, filter, and message. Handle scope and payment off-platform.'},
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
          </nav>
          <a href="#waitlist" className="rounded-2xl bg-slate-900 text-white text-sm px-4 py-2 shadow hover:shadow-md">Join waitlist</a>
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
                <a href="#waitlist" className="rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-medium shadow hover:shadow-md">
                  Join the waitlist
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
            Built by tax pros, for tax pros. Beta access rolling out monthly.
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
              <a href="#waitlist" className="inline-block rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-medium shadow hover:shadow-md">Join the waitlist</a>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist / Form embed */}
      <section id="waitlist" className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <div className="rounded-3xl border border-slate-200 bg-white p-8">
              <h3 className="text-xl font-semibold text-slate-900">Get early access</h3>
              <p className="mt-2 text-slate-600">We'll invite the first cohort of CPAs, EAs, and CTEC preparers soon. Add your email to join the beta.</p>
              <form
                onSubmit={handleSubmit}
                className="mt-5 space-y-3"
                noValidate
              >
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@firm.com"
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <select
                    value={roleInterest}
                    onChange={(e) => setRoleInterest(e.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="">Role (optional)</option>
                    <option value="CPA">CPA</option>
                    <option value="EA">EA</option>
                    <option value="CTEC">CTEC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What are you looking for? (optional)"
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-medium shadow hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Joining...' : 'Join the waitlist'}
                </button>
              </form>
              <p className="mt-3 text-xs text-slate-500">We'll never spam. You can unsubscribe anytime.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8">
              <h3 className="text-xl font-semibold text-slate-900">Why join the waitlist?</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Early access to create your professional profile</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Priority support during onboarding and verification</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Shape the platform with early feedback</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>First to know when we launch</span>
                </div>
              </div>
            </div>
          </div>
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
              <a href="#waitlist" className="hover:text-slate-900">Join beta</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
