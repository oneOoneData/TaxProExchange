'use client';

import { useState } from 'react';

export default function DemoRequestButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', firmName: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send');
      setStatus('error');
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
      >
        Book 15-min Demo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => { setOpen(false); setStatus('idle'); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {status === 'success' ? (
              <div className="text-center py-6">
                <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Message sent!</h3>
                <p className="text-slate-600">We&rsquo;ll be in touch within one business day to schedule your demo.</p>
                <button
                  onClick={() => { setOpen(false); setStatus('idle'); }}
                  className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">Book a 15-min Demo</h3>
                <p className="text-slate-500 text-sm mb-5">Tell us a bit about your firm and we&rsquo;ll reach out to schedule a call.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="jane@smithcpa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Firm Name</label>
                    <input
                      type="text"
                      value={form.firmName}
                      onChange={(e) => setForm({ ...form, firmName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="Smith & Associates CPA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Anything you'd like us to know?</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                      placeholder="e.g. We need overflow help during busy season for S-corps..."
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-sm text-red-600">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {status === 'submitting' ? 'Sending...' : 'Request Demo'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
