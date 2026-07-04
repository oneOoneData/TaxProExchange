'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
  // Private fields (only shown with access)
  seller_name?: string;
  firm_name?: string;
  email?: string;
  phone?: string;
  city?: string;
}

export default function PracticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    const res = await fetch(`/api/practices/${id}`);
    if (res.ok) {
      const data = await res.json();
      setListing(data.listing);
      setHasAccess(data.hasAccess);
    }
    setLoading(false);
  };

  const handleUpgrade = async () => {
    setCheckingOut(true);
    const res = await fetch('/api/practice-buyer/checkout', { method: 'POST' });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
    setCheckingOut(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Listing not found</h2>
        <Link href="/practices" className="text-blue-600 hover:underline">Browse practices →</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <AppNavigation />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/practices" className="text-sm text-blue-600 hover:text-blue-700 mb-6 inline-block">← Back to all practices</Link>

        <div className="bg-white rounded-xl border border-slate-200 p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {hasAccess ? listing.firm_name : `Practice in ${listing.state}`}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Est. {listing.years_established} years · {listing.state}
                {hasAccess && listing.city && ` · ${listing.city}`}
              </p>
            </div>
            <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600">{listing.reason_for_sale || 'For sale'}</span>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Revenue</p>
              <p className="text-lg font-bold text-slate-900">${(listing.annual_revenue_min/1000).toFixed(0)}K–${(listing.annual_revenue_max/1000).toFixed(0)}K</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Clients</p>
              <p className="text-lg font-bold text-slate-900">{listing.client_count_min}–{listing.client_count_max}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Staff</p>
              <p className="text-lg font-bold text-slate-900">{listing.staff_count} + owner</p>
            </div>
            {listing.asking_price_min && (
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-emerald-600">Asking price</p>
                <p className="text-lg font-bold text-emerald-700">${(listing.asking_price_min/1000).toFixed(0)}K{listing.asking_price_max ? `–${(listing.asking_price_max/1000).toFixed(0)}K` : '+}'}</p>
              </div>
            )}
          </div>

          {/* Revenue Breakdown */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Revenue Mix</h3>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-blue-500" style={{width: `${listing.revenue_pct_tax}%`}} title={`Tax prep: ${listing.revenue_pct_tax}%`} />
              <div className="bg-emerald-500" style={{width: `${listing.revenue_pct_bookkeeping}%`}} title={`Bookkeeping: ${listing.revenue_pct_bookkeeping}%`} />
              <div className="bg-amber-500" style={{width: `${listing.revenue_pct_advisory}%`}} title={`Advisory: ${listing.revenue_pct_advisory}%`} />
            </div>
            <div className="flex gap-4 mt-1 text-xs text-slate-500">
              <span>🔵 Tax {listing.revenue_pct_tax}%</span>
              <span>🟢 Bookkeeping {listing.revenue_pct_bookkeeping}%</span>
              <span>🟡 Advisory {listing.revenue_pct_advisory}%</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {listing.specialties?.map((s: string) => (
              <span key={s} className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-full font-medium">{s}</span>
            ))}
            {listing.software_stack?.map((s: string) => (
              <span key={s} className="px-2.5 py-1 text-xs bg-purple-50 text-purple-700 rounded-full font-medium">{s}</span>
            ))}
            {listing.remote_friendly && <span className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-full font-medium">🌐 Remote-friendly</span>}
            {listing.seller_financing && <span className="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 rounded-full font-medium">💰 Seller financing</span>}
          </div>

          {/* Notes */}
          {listing.additional_notes && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">{listing.additional_notes}</p>
            </div>
          )}

          {/* Contact Info / Paywall */}
          {hasAccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-emerald-800 mb-3">Seller Contact Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-emerald-700 font-medium">Name:</span> {listing.seller_name}</div>
                <div><span className="text-emerald-700 font-medium">Firm:</span> {listing.firm_name}</div>
                <div><span className="text-emerald-700 font-medium">Email:</span> <a href={`mailto:${listing.email}`} className="text-blue-600 hover:underline">{listing.email}</a></div>
                {listing.phone && <div><span className="text-emerald-700 font-medium">Phone:</span> {listing.phone}</div>}
                <div><span className="text-emerald-700 font-medium">Location:</span> {listing.city}, {listing.state}</div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <svg className="w-8 h-8 text-amber-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-sm font-semibold text-amber-800 mb-1">Contact info locked</h3>
              <p className="text-xs text-amber-700 mb-4">Pay $150/year to unlock seller name, firm, email, phone, and location — across all listings.</p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Unlock All Contact Info — $150/year
              </button>
            </div>
          )}
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Unlock All Practices for Sale</h2>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm">✓ Full contact info for every listed practice</li>
                <li className="flex items-start gap-2 text-sm">✓ Access to all new listings</li>
                <li className="flex items-start gap-2 text-sm">✓ No auto-renewal</li>
              </ul>
              <div className="flex gap-3">
                <button onClick={handleUpgrade} disabled={checkingOut} className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                  {checkingOut ? 'Redirecting...' : 'Unlock Now — $150/year'}
                </button>
                <button onClick={() => setShowUpgradeModal(false)} className="px-4 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg">
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
