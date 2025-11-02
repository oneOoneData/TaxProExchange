'use client';

import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { JoinButton } from '@/components/JoinButton';
import UserMenu from '@/components/UserMenu';
import Logo from '@/components/Logo';
import MobileNav from '@/components/MobileNav';
import FeaturedProfiles from '@/components/FeaturedProfiles';
import BuyMeACoffee from '@/components/BuyMeACoffee';
import NblPromoBanner from '@/components/NblPromoBanner';

interface HomePageClientProps {
  faqs: Array<{ question: string; answer: string }>;
}

export default function HomePageClient({ faqs }: HomePageClientProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  // Auto-redirect authenticated users to their dashboard
  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard');
    }
  }, [isLoaded, user, router]);

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
    { n: '1', title: 'Join & Sign In', desc: 'Sign in with Google to get started.' },
    { n: '2', title: 'Create Profile', desc: 'Set up your professional profile with credentials and specializations.' },
    { n: '3', title: 'Connect & Collaborate', desc: 'Search, filter, and message other professionals. Handle scope and payment off-platform.' },
    { n: '4', title: 'Grow & Learn', desc: 'Access mentorship and attend events to expand your expertise and network.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="container-mobile py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/search" className="hover:text-slate-900">Directory</a>
            
            {/* Community Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                onBlur={() => setTimeout(() => setIsCommunityOpen(false), 200)}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors"
              >
                Community
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isCommunityOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <a href="/jobs" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                    Jobs
                  </a>
                  <a href="/events" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                    Events
                  </a>
                  <a href="/mentorship" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                    Mentorship
                  </a>
                </div>
              )}
            </div>
            
            <a href="/partners" className="hover:text-slate-900 flex items-center gap-1.5">
              <span className="text-base">🤝</span>
              Partners
            </a>
            
            <a href="/ai" className="hover:text-slate-900">AI</a>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu
                userName={user.fullName || undefined}
                userEmail={user.primaryEmailAddress?.emailAddress}
              />
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <a href="/sign-in?redirect_url=/dashboard" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                  Sign In
                </a>
                <a href="/join" className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors">
                  Join Free
                </a>
                <a href="/firm" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  For Firms
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
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

      {/* Promo Banner */}
      <NblPromoBanner />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-mobile pt-16 pb-10 md:pt-24 md:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
                Connect with Verified Tax Professionals
              </h1>
              <p className="mt-4 text-slate-600 text-lg">
                The trusted network for CPAs, EAs, and tax professionals. Find collaborators for overflow work, niche expertise, mentorship, and review & sign-off.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {!user && (
                  <a href="/join" className="rounded-2xl bg-slate-900 text-white px-6 py-3 sm:px-8 text-sm font-medium shadow-lg hover:shadow-xl transition-all">
                    Join Free
                  </a>
                )}
                <a href="/search" className="rounded-2xl bg-white text-slate-900 border border-slate-200 px-6 py-3 sm:px-8 text-sm font-medium hover:bg-slate-50 shadow-sm hover:shadow-md transition-all">
                  Browse Directory
                </a>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                  <span>Verified credentials</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                  <span>Free forever</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                  <span>Hundreds of professionals</span>
                </span>
              </div>
              
              {/* For Firms Callout */}
              <div className="mt-8 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">For Firms</h3>
                    <p className="text-sm text-blue-800">
                      Build your trusted bench of professionals for $10/month. <a href="#pricing" className="underline font-medium hover:text-blue-900">Learn more</a>
                    </p>
                  </div>
                </div>
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
                    <li key={i} className="flex items-start sm:items-center justify-between rounded-xl border p-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{p.name}</span>
                          {p.verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap flex-shrink-0">Verified</span>}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 mt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="whitespace-nowrap">{p.tag} • {p.state}</span>
                            <span className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                              {p.software}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-xs sm:text-sm rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-slate-50 whitespace-nowrap flex-shrink-0">Connect</button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-xs text-slate-500">*Profiles shown are illustrative.</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logos / social proof */}
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

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="container-mobile">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-slate-600">Free for individual tax professionals. Affordable for firms.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Individual Plan */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-slate-900">Individual</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Free
                </span>
              </div>
              <div className="mb-6">
                <div className="text-4xl font-bold text-slate-900">$0</div>
                <div className="text-slate-600">Forever free</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Create your verified professional profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Search and connect with other professionals</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Access mentorship opportunities</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Join curated events and workshops</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Direct messaging with professionals</span>
                </li>
              </ul>
              <a href="/join" className="block text-center rounded-2xl bg-slate-900 text-white px-6 py-3 text-sm font-medium shadow hover:shadow-md transition-all">
                Join Free
              </a>
            </motion.div>

            {/* Firm Plan */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="rounded-3xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-bl-full opacity-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-semibold text-slate-900">Firm Workspace</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Scale Your Team
                  </span>
                </div>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-slate-900">$10</div>
                  <div className="text-slate-600">per month</div>
                </div>
                <div className="mb-6 p-4 rounded-2xl bg-white border border-blue-100">
                  <div className="text-sm font-medium text-blue-900 mb-2">Everything in Individual, plus:</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700 font-medium">Build your trusted bench of professionals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Add team members to manage your bench</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Categorize professionals by specialty</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Send invitations to verified professionals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Public firm profile page (optional)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Collaborative team management</span>
                  </li>
                </ul>
                <a href="/firm" className="block text-center rounded-2xl bg-blue-600 text-white px-6 py-3 text-sm font-medium shadow-lg hover:shadow-xl transition-all hover:bg-blue-700">
                  Start Firm Workspace
                </a>
              </div>
            </motion.div>
          </div>

          {/* Preview of Team Dashboard */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-16 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-slate-900">See How Firms Build Their Bench</h3>
              <p className="mt-2 text-slate-600">Organize and manage your trusted professionals in one place</p>
            </div>
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-lg">
              {/* Mock Team Dashboard Screenshot */}
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h4 className="text-xl font-semibold text-slate-900">Smith & Associates CPA Extended Team</h4>
                    <p className="text-sm text-slate-600">Manage your trusted bench of professionals</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add from Directory
                  </button>
                </div>
                
                {/* Categories */}
                <div className="space-y-4">
                  {/* Category: S-Corp / Partnership */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h5 className="text-md font-semibold text-purple-900 bg-purple-100 px-3 py-1 rounded-lg">S-Corp / Partnership</h5>
                      <div className="h-px flex-1 bg-purple-200"></div>
                      <span className="text-sm text-slate-500">2 members</span>
                    </div>
                    <div className="space-y-3 pl-4">
                      {/* Team Member 1 */}
                      <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold flex-shrink-0">JC</div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900">Jordan Chen, CPA</div>
                              <div className="text-sm text-slate-600">Los Angeles, CA • Drake Tax</div>
                              <div className="text-sm text-blue-600 font-medium mt-1">Senior Review Partner</div>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 flex-shrink-0">
                            Message
                          </button>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <p className="text-xs text-slate-600 italic">Team note: Goes through returns quickly, great for Q1 surge. Prefers complex K-1s.</p>
                          </div>
                        </div>
                      </div>
                      {/* Team Member 2 */}
                      <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-semibold flex-shrink-0">AP</div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900">Alex Park, CPA</div>
                              <div className="text-sm text-slate-600">San Francisco, CA • ProConnect</div>
                              <div className="text-sm text-blue-600 font-medium mt-1">K-1 Specialist</div>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 flex-shrink-0">
                            Message
                          </button>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <p className="text-xs text-slate-600 italic">Team note: Available Tue-Fri. Excellent with multi-state apportionment. Usually responds within 2 hours.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category: IRS Representation */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h5 className="text-md font-semibold text-purple-900 bg-purple-100 px-3 py-1 rounded-lg">IRS Representation</h5>
                      <div className="h-px flex-1 bg-purple-200"></div>
                      <span className="text-sm text-slate-500">1 member</span>
                    </div>
                    <div className="space-y-3 pl-4">
                      {/* Team Member 3 */}
                      <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-semibold flex-shrink-0">MR</div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900">Maya Rodriguez, EA</div>
                              <div className="text-sm text-slate-600">Austin, TX • Tax Resolution Pro</div>
                              <div className="text-sm text-blue-600 font-medium mt-1">IRS Appeals Specialist</div>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 flex-shrink-0">
                            Message
                          </button>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <p className="text-xs text-slate-600 italic">Team note: Our go-to for audit defense. Former IRS agent. Expensive but worth it for high-stakes cases.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Preview:</strong> This is how your firm's team dashboard will look. Organize professionals by category, add custom titles, and manage your bench efficiently.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
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
                </div>
              ))}
              <div>
                <h4 className="font-medium text-slate-900">Why did you start this web app?</h4>
                <p className="mt-2 text-sm text-slate-600"><a href="/reddit" className="text-blue-600 hover:text-blue-800 underline">This</a> explains it best.</p>
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
