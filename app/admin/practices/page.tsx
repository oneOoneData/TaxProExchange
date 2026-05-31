'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface PendingListing {
  id: string;
  created_at: string;
  seller_name: string;
  firm_name: string;
  email: string;
  phone: string | null;
  city: string;
  state: string;
  years_established: number;
  annual_revenue_min: number;
  annual_revenue_max: number;
  client_count_min: number;
  client_count_max: number;
  staff_count: number;
  specialties: string[];
  software_stack: string[];
  asking_price_min: number | null;
  asking_price_max: number | null;
  reason_for_sale: string;
  remote_friendly: boolean;
  seller_financing: boolean;
  additional_notes: string | null;
}

export default function AdminPracticesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && (!user || user.primaryEmailAddress?.emailAddress !== 'koen@taxproexchange.com')) {
      router.push('/');
      return;
    }
    if (isLoaded && user) fetchPending();
  }, [isLoaded, user]);

  const fetchPending = async () => {
    const res = await fetch('/api/admin/practices');
    if (res.ok) {
      const data = await res.json();
      setListings(data.listings || []);
    }
    setLoading(false);
  };

  const handleAction = async (id: string, status: string) => {
    const res = await fetch('/api/admin/practices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setListings(prev => prev.filter(l => l.id !== id));
    }
  };

  if (!isLoaded || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Pending Practice Listings</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No pending listings</div>
        ) : (
          <div className="space-y-4">
            {listings.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{l.firm_name}</h2>
                    <p className="text-sm text-slate-500">{l.seller_name} · {l.city}, {l.state} · {l.email}{l.phone ? ` · ${l.phone}` : ''}</p>
                    <p className="text-xs text-slate-400">Listed {new Date(l.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(l.id, 'active')} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">
                      ✅ Approve
                    </button>
                    <button onClick={() => handleAction(l.id, 'rejected')} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
                      ❌ Reject
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-slate-500">Revenue:</span> ${(l.annual_revenue_min/1000).toFixed(0)}K–${(l.annual_revenue_max/1000).toFixed(0)}K</div>
                  <div><span className="text-slate-500">Clients:</span> {l.client_count_min}–{l.client_count_max}</div>
                  <div><span className="text-slate-500">Staff:</span> {l.staff_count}</div>
                  <div><span className="text-slate-500">Asking:</span> {l.asking_price_min ? `$${(l.asking_price_min/1000).toFixed(0)}K` : 'N/A'}{l.asking_price_max ? `–$${(l.asking_price_max/1000).toFixed(0)}K` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
