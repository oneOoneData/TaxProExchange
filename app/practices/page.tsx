'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppNavigation from '@/components/AppNavigation';
import Footer from '@/components/Footer';

interface Listing {
  id: string;
  state: string;
  years_established: number;
  annual_revenue_min: number;
  annual_revenue_max: number;
  client_count_min: number;
  client_count_max: number;
  revenue_pct_tax: number;
  revenue_pct_bookkeeping: number;
  revenue_pct_advisory: number;
  staff_count: number;
  specialties: string[];
  software_stack: string[];
  asking_price_min: number | null;
  asking_price_max: number | null;
  reason_for_sale: string;
  remote_friendly: boolean;
  seller_financing: boolean;
  additional_notes: string | null;
  created_at: string;
}

export default function PracticesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
    checkAccess();
  }, []);

  const fetchListings = async () => {
    const res = await fetch('/api/practices');
    if (res.ok) {
      const data = await res.json();
      setListings(data.listings || []);
    }
    setLoading(false);
  };

  const checkAccess = async () => {
    const res = await fetch('/api/practice-buyer/status');
    if (res.ok) {
      const data = await res.json();
      setHasAccess(data.hasAccess);
    }
  };


  const handleUpgrade = async () => {
    setCheckingOut(true);
    setUpgradeError(null);
    try {
      const res = await fetch('/api/practice-buyer/checkout', { method: 'POST' });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const err = await res.json();
        setUpgradeError(err.error || 'Failed to create checkout session. Stripe may not be configured yet.');
      }
    } catch (e) {
      setUpgradeError('Network error. Please try again.');
    }
    setCheckingOut(false);
  };

  const formatRevenue = (min: number, max: number) =>
    `$${(min / 1000).toFixed(0)}K–$${(max / 1000).toFixed(0)}K`;

  const formatClients = (min: number, max: number) =>
    `${min}–${max}`;

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not listed';
    if (min && max) return `$${(min / 1000).toFixed(0)}K–$${(max / 1000).toFixed(0)}K`;
    if (min) return `From $${(min / 1000).toFixed(0)}K`;
    return `Up to $${(max! / 1000).toFixed(0)}K`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <AppNavigation />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Practices for Sale</h1>
          <p className="text-slate-600 mb-4 max-w-2xl">
            Retiring tax professionals list their practices here. Browse anonymously, unlock seller contact info when you&apos;re ready.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            {!hasAccess && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Unlock All Contact Info — $150/year
              </button>
            )}
            <Link
              href="/practices/list"
              className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              List Your Practice Free
            </Link>
          </div>

          {/* Value prop + blog links */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">
              $150/year gives you full access to every listing — seller name, firm, email, phone, and city.
            </p>
            <p className="text-xs text-blue-700">
              No per-listing fees. One price, everything. No auto-renewal.{' '}
              <Link href="/insights/how-to-buy-a-cpa-practice" className="underline hover:no-underline">How to buy a practice →</Link>{' · '}
              <Link href="/insights/cpa-practice-valuation-2026" className="underline hover:no-underline">Valuation guide →</Link>
            </p>
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-4"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Unlock All Practices for Sale</h2>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  Full contact info for every listed practice
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  Access to all new listings added this year
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  Direct seller name, email, phone, and city
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  No auto-renewal
                </li>
              </ul>
              <p className="text-xs text-slate-500 mb-6">No per-listing fees. One price, everything.</p>
              {upgradeError && (
                <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded">{upgradeError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleUpgrade}
                  disabled={checkingOut}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                  {checkingOut ? 'Redirecting...' : 'Unlock Now — $150/year'}
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Not now
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No practices listed yet</h3>
            <p className="text-slate-500 mb-6">Be the first to list your practice.</p>
            <Link
              href="/practices/list"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              List Your Practice Free
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="mb-3">
                  <span className="text-sm font-semibold text-slate-900">{listing.state}</span>
                  <span className="text-xs text-slate-400 ml-2">Est. {listing.years_established}yrs</span>
                </div>

                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Revenue</span>
                    <span className="font-medium text-slate-900">{formatRevenue(listing.annual_revenue_min, listing.annual_revenue_max)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Clients</span>
                    <span className="font-medium text-slate-900">{formatClients(listing.client_count_min, listing.client_count_max)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Staff</span>
                    <span className="font-medium text-slate-900">{listing.staff_count} + owner</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mix</span>
                    <span className="font-medium text-slate-900">{listing.revenue_pct_tax}% tax / {listing.revenue_pct_bookkeeping}% bk</span>
                  </div>
                  {listing.asking_price_min && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Asking</span>
                      <span className="font-medium text-emerald-700">{formatPrice(listing.asking_price_min, listing.asking_price_max)}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {listing.specialties?.slice(0, 3).map((s: string) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">{s}</span>
                  ))}
                  {listing.remote_friendly && (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">Remote OK</span>
                  )}
                  {listing.seller_financing && (
                    <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">Financing avail.</span>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={`/practices/${listing.id}`}
                  className="block w-full py-2 text-center text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {hasAccess ? 'View Contact Info →' : '🔒 Unlock to Contact'}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
