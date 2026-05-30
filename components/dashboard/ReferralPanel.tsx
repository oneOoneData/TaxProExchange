'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Referral {
  id: string;
  referrer_id: string;
  recipient_id: string;
  client_name: string;
  client_info?: string;
  fee_amount: number;
  platform_cut_percent: number;
  status: string;
  message?: string;
  created_at: string;
  referrer?: { first_name: string; last_name: string; slug: string };
  recipient?: { first_name: string; last_name: string; slug: string };
}

interface ReferralPanelProps {
  profileId: string;
}

export default function ReferralPanel({ profileId }: ReferralPanelProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [formData, setFormData] = useState({ client_name: '', client_info: '', fee_amount: '3000', message: '' });
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'sent' | 'received'>('received');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await fetch('/api/referrals/list');
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals || []);
      }
    } catch (e) {
      console.error('Failed to fetch referrals:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (referralId: string) => {
    const res = await fetch('/api/referrals/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referral_id: referralId }),
    });

    if (res.ok) {
      fetchReferrals();
    }
  };

  const handleDecline = async (referralId: string) => {
    const res = await fetch('/api/referrals/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referral_id: referralId }),
    });

    if (res.ok) {
      fetchReferrals();
    }
  };

  const searchProfiles = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.profiles || []);
      }
    } catch (e) {}
  };

  const handleSend = async () => {
    if (!selectedRecipient || !formData.client_name) return;
    setSending(true);

    try {
      const res = await fetch('/api/referrals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: selectedRecipient.id,
          client_name: formData.client_name,
          client_info: formData.client_info,
          fee_amount: parseInt(formData.fee_amount),
          message: formData.message,
        }),
      });

      if (res.ok) {
        setShowSendForm(false);
        setSelectedRecipient(null);
        setFormData({ client_name: '', client_info: '', fee_amount: '3000', message: '' });
        fetchReferrals();
      }
    } catch (e) {
      console.error('Failed to send referral:', e);
    } finally {
      setSending(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      accepted: 'bg-blue-100 text-blue-800',
      declined: 'bg-red-100 text-red-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`;
  };

  const receivedReferrals = referrals.filter(r => r.recipient_id === profileId);
  const sentReferrals = referrals.filter(r => r.referrer_id === profileId);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Referrals</h2>
        <button
          onClick={() => setShowSendForm(!showSendForm)}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showSendForm ? 'Cancel' : '+ Send Referral'}
        </button>
      </div>

      {/* Send Referral Form */}
      <AnimatePresence>
        {showSendForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Find Pro to Refer To</label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={e => searchProfiles(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchResults.length > 0 && (
                  <div className="mt-1 border border-slate-200 rounded-lg bg-white max-h-40 overflow-y-auto">
                    {searchResults.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedRecipient(p); setSearchQuery(`${p.first_name} ${p.last_name}`); setSearchResults([]); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        {p.first_name} {p.last_name} — {p.credential_type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="John's Tax Prep"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client Details (optional)</label>
                <textarea
                  value={formData.client_info}
                  onChange={e => setFormData({ ...formData, client_info: e.target.value })}
                  placeholder="Scope of work, contact info, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Referral Fee ($)</label>
                  <input
                    type="number"
                    value={parseInt(formData.fee_amount) / 100}
                    onChange={e => setFormData({ ...formData, fee_amount: String(parseFloat(e.target.value) * 100 || 0) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    min={1}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">You Receive</label>
                  <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-emerald-700 font-medium">
                    ${Math.round(parseInt(formData.fee_amount || '0') * 0.9 / 100)}
                  </div>
                </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">10% platform fee goes to TaxProExchange</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message (optional)</label>
                <input
                  type="text"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Why this referral is a good fit"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !selectedRecipient || !formData.client_name}
                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? 'Sending...' : 'Send Referral'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 mb-3 border-b border-slate-200">
        <button
          onClick={() => setTab('received')}
          className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'received' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Received ({receivedReferrals.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'sent' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Sent ({sentReferrals.length})
        </button>
      </div>

      {/* Referral List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tab === 'received' && receivedReferrals.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">No referrals received yet</p>
        )}
        {tab === 'sent' && sentReferrals.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">No referrals sent yet. Find a pro and refer them a client!</p>
        )}

        <AnimatePresence>
          {(tab === 'received' ? receivedReferrals : sentReferrals).map((ref) => (
            <motion.div
              key={ref.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {ref.client_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {tab === 'received' 
                      ? `From: ${ref.referrer?.first_name} ${ref.referrer?.last_name}`
                      : `To: ${ref.recipient?.first_name} ${ref.recipient?.last_name}`
                    }
                  </p>
                </div>
                <span className={statusBadge(ref.status)}>{ref.status}</span>
              </div>

              <p className="text-xs text-slate-400">
                Fee: ${ref.fee_amount / 100} · {new Date(ref.created_at).toLocaleDateString()}
              </p>

              {ref.message && (
                <p className="text-xs text-slate-500 mt-1 italic">&quot;{ref.message}&quot;</p>
              )}

              {/* Actions */}
              {tab === 'received' && ref.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAccept(ref.id)}
                    className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Accept (Pay ${ref.fee_amount / 100})
                  </button>
                  <button
                    onClick={() => handleDecline(ref.id)}
                    className="px-3 py-1 bg-white text-slate-600 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {referrals.length > 0 && (
        <p className="text-xs text-slate-400 text-center mt-4">
          Referral fees processed via Stripe · 10% platform fee
        </p>
      )}
    </div>
  );
}
