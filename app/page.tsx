'use client';

import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { JoinButton } from '@/components/JoinButton';
import UserMenu from '@/components/UserMenu';
import Logo from '@/components/Logo';
import BuyMeACoffee from '@/components/BuyMeACoffee';
import MobileNav from '@/components/MobileNav';
import FeaturedProfiles from '@/components/FeaturedProfiles';
import SeoFaqJsonLd from '@/components/SeoFaqJsonLd';
import { jsonLd, websiteSearchLD } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default function Page() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Check onboarding status and redirect only if incomplete
  useEffect(() => {
    if (user && isLoaded) {
      // Check if user has completed onboarding by checking if they have a credential_type
      // This is a simple check - if they have a credential_type, they've completed onboarding
      fetch(`/api/profile?clerk_id=${user.id}`)
        .then(response => response.json())
        .then(data => {
          console.log('[home] profile data:', data);
          if (data.error) {
            // User doesn't have a profile yet, redirect to onboarding
            console.log('[trace] router.push → /onboarding (no profile)');
            router.push('/onboarding');
          } else if (data.onboarding_complete) {
            // User has completed onboarding, redirect to dashboard
            console.log('[trace] onboarding complete, redirecting to dashboard');
            router.push('/dashboard');
          } else {
            // User hasn't completed onboarding, redirect to profile edit
            console.log('[trace] router.push → /profile/edit (onboarding incomplete)');
            router.push('/profile/edit');
          }
        })
        .catch(error => {
          console.error('Error checking onboarding status:', error);
          console.log('[home] API call failed, redirecting to onboarding');
          // On error, redirect to onboarding to be safe
          router.push('/onboarding');
        });
    } else if (isLoaded) {
      setIsCheckingOnboarding(false);
    }
  }, [user, isLoaded, router]);

  // Show loading state while checking
  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

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
    {
      title: 'Mentorship Opportunities',
      desc: 'Connect with experienced professionals for guidance or offer mentorship to those starting out.'
    },
    {
      title: 'Curated Events',
      desc: 'Join webinars, workshops, and networking events designed for tax professionals.'
    },
  ];

  const steps = [
    { n: '1', title: 'Join & Sign In', desc: 'Sign in with Google to get started.'},
    { n: '2', title: 'Create Profile', desc: 'Set up your professional profile with credentials and specializations.'},
    { n: '3', title: 'Connect & Collaborate', desc: 'Search, filter, and message other professionals. Handle scope and payment off-platform.'},
    { n: '4', title: 'Grow & Learn', desc: 'Access mentorship and attend events to expand your expertise and network.'},
  ];

  const faqs = [
    {
      question: 'Do you process payments or hold funds?',
      answer: 'No. TaxProExchange is a connection-only platform. Professionals handle contracts and payments off-platform.'
    },
    {
      question: 'How do you verify credentials?',
      answer: 'We manually check state CPA boards, IRS EA enrollment, and CTEC registration before profiles are visible.'
    },
    {
      question: 'Is it free?',
      answer: 'Yes, for as long as we can keep it free. Costs will run up at some point but our goal is to create value not become the next TaxFyle.'
    },
    {
      question: 'Can clients use this?',
      answer: 'This is built for professionals only: CPAs, EAs, and registered preparers who need collaboration and referrals.'
    },
    {
      question: 'What about mentorship and events?',
      answer: 'Beyond the directory and job board, we offer mentorship matching and curated events like webinars and workshops to help you grow professionally.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* FAQ JSON-LD Schema */}
      <SeoFaqJsonLd faqs={faqs} />
      
      {/* WebSite + SearchAction JSON-LD */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={jsonLd(websiteSearchLD())} 
      />
      
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="container-mobile py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
            <a href="/search" className="hover:text-slate-900">Directory</a>
            <a href="/jobs" className="hover:text-slate-900">Jobs</a>
            <a href="/events" className="hover:text-slate-900">Events</a>
            <a href="/mentorship" className="hover:text-slate-900">Mentorship</a>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu 
                userName={user.fullName || undefined}
                userEmail={user.primaryEmailAddress?.emailAddress}
              />
            ) : (
              <JoinButton />
            )}
            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                console.log('Mobile menu button clicked');
                setIsMobileNavOpen(true);
              }}
              className="mobile-menu-btn"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-mobile pt-16 pb-10 md:pt-24 md:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
                Where Tax Professionals
                <span className="block">Connect and Collaborate</span>
              </h1>
              <p className="mt-4 text-slate-600 text-lg">
                A trusted directory for CPAs, EAs, and CTEC preparers to find each other for
                handoffs, overflow work, and representation. Plus mentorship opportunities and curated events. No payments or file exchange - just verified connections.
              </p>
                              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  {!user && (
                    <a href="/join" className="rounded-2xl bg-slate-900 text-white px-6 py-3 sm:px-8 text-sm font-medium shadow-lg hover:shadow-xl transition-all">
                      Join Now
                    </a>
                  )}
                  <a href="/search" className="rounded-2xl bg-white text-slate-900 border border-slate-200 px-6 py-3 sm:px-8 text-sm font-medium hover:bg-slate-50 shadow-sm hover:shadow-md transition-all">
                    Browse Verified Professionals
                  </a>
                </div>
              <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Manual credential checks</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Free to list</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Hundreds of verified profiles</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
              <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Example search</div>
                <a href="/search?credential_type=CPA&state=CA&specialization=1120s_s_corp&accepting_work=true" className="block rounded-xl border bg-slate-50 p-3 text-sm hover:bg-slate-100 transition-colors">
                  CPA • California • S-Corp Reviews • Accepting work
                </a>
                <ul className="mt-4 space-y-3">
                  {[
                    { name: 'Jordan C., CPA', tag: 'S-Corp / Multi-State', state: 'CA', software: 'Drake Tax', verified: true },
                    { name: 'Maya R., EA', tag: 'IRS Representation', state: 'TX', software: 'ProConnect', verified: true },
                    { name: 'Leo P., CTEC', tag: '1040 + Sched C', state: 'CA', software: 'Truss', verified: true },
                  ].map((p, i) => (
                    <li key={i} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {p.name}
                          {p.verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Verified</span>}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <span>{p.tag} • {p.state}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                            {p.software}
                          </span>
                        </div>
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
        <div className="container-mobile">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 text-center text-sm text-slate-500">
            Built by tax pros, for tax pros. Join now to create your professional profile.
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16">
        <div className="container-mobile">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-slate-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Profiles */}
      <section className="py-16 bg-slate-50">
        <div className="container-mobile">
          <FeaturedProfiles />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-8">
        <div className="container-mobile">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <div key={i} className="rounded-2xl border p-6">
                  <div className="text-slate-400 text-sm">Step {s.n}</div>
                  <div className="mt-1 font-semibold text-slate-900">{s.title}</div>
                  <div className="mt-2 text-slate-600 text-sm">{s.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <a href="/join" className="inline-block rounded-2xl bg-slate-900 text-white px-4 py-3 sm:px-5 text-sm font-medium shadow hover:shadow-md">Join Now</a>
            </div>
          </div>
        </div>
      </section>

      {/* Join CTA Section */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
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
              className="inline-flex items-center px-6 py-3 sm:px-8 border border-transparent text-base font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all"
            >
              Join Now
            </a>
            <a
              href="#features"
              className="inline-flex items-center px-6 py-3 sm:px-8 border border-transparent text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900">FAQ</h2>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <h4 className="font-medium text-slate-900">{faq.question}</h4>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                  {i === 2 && (
                    <>
                      <p className="mt-2 text-sm text-slate-600">Having said that, we can always use more coffee so we can keep coding.</p>
                      <BuyMeACoffee />
                    </>
                  )}
                </div>
              ))}
              <div>
                <h4 className="font-medium text-slate-900">Why did you start this web app?</h4>
                <p className="mt-2 text-sm text-slate-600"><a href="https://www.taxproexchange.com/reddit" className="text-blue-600 hover:text-blue-800 underline">This</a> explains it best.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Navigation */}
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

    </div>
  );
}
