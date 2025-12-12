'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import AdminRouteGuard from '@/components/AdminRouteGuard';

// Events Refresh Button Component
function EventsRefreshButton() {
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [eventsCount, setEventsCount] = useState<number | null>(null);
  const [publishableCount, setPublishableCount] = useState<number | null>(null);

  useEffect(() => {
    loadEventsCount();
  }, []);

  const loadEventsCount = async () => {
    try {
      // Get total events count
      const allResponse = await fetch('/api/events?mode=all');
      const allData = await allResponse.json();
      setEventsCount(allData.events?.length ?? 0);

      // Get publishable events count (this will only return verified events)
      const curatedResponse = await fetch('/api/events?mode=curated');
      const curatedData = await curatedResponse.json();
      setPublishableCount(curatedData.events?.length ?? 0);
    } catch (error) {
      console.error('Error loading events count:', error);
    }
  };

  const refreshEvents = async () => {
    setRefreshing(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/events/refresh', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle new response format with ingestion and validation results
        if (data.ingestion && data.validation) {
          setResult(`✅ Success! AI fetched ${data.total} events\n\n` +
            `📥 Ingestion Results:\n` +
            `  • Processed: ${data.ingestion.processed}\n` +
            `  • Inserted: ${data.ingestion.inserted}\n` +
            `  • Updated: ${data.ingestion.updated}\n` +
            `  • Errors: ${data.ingestion.errors}\n\n` +
            `🔍 Link Validation Results:\n` +
            `  • Processed: ${data.validation.processed}\n` +
            `  • Validated: ${data.validation.validated}\n` +
            `  • Publishable: ${data.validation.publishable}\n` +
            `  • Errors: ${data.validation.errors}`);
        } else {
          // Fallback for old response format
          setResult(`✅ Success! AI fetched ${data.total} events\n` +
            `Inserted: ${data.inserted}\n` +
            `Errors: ${data.errors}`);
        }
        
        // Reload counts
        await loadEventsCount();
      } else {
        const error = await response.json();
        setResult(`❌ Error: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const clearEvents = async () => {
    if (!confirm('Are you sure you want to clear all events? This action cannot be undone.')) {
      return;
    }

    setRefreshing(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/clear-events', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Successfully cleared ${data.clearedCount} events\n` +
          `Staging events cleared: ${data.stagingCleared}\n` +
          `Tombstones cleared: ${data.tombstonesCleared}`);
        
        // Reload counts
        await loadEventsCount();
      } else {
        const error = await response.json();
        setResult(`❌ Error: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600 mb-2 space-y-1">
        <div>
          Total events in database: <span className="font-semibold">{eventsCount ?? '...'}</span>
        </div>
        <div>
          Verified & publishable events: <span className="font-semibold text-green-600">{publishableCount ?? '...'}</span>
        </div>
        {eventsCount !== null && publishableCount !== null && eventsCount > 0 && (
          <div className="text-xs text-slate-500">
            Validation rate: {((publishableCount / eventsCount) * 100).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={refreshEvents}
          disabled={refreshing}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Refreshing & Validating...' : 'Refresh Events (AI + Link Validation)'}
        </button>
        <button
          onClick={clearEvents}
          disabled={refreshing}
          className="inline-flex items-center justify-center rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Clearing...' : 'Clear All Events'}
        </button>
      </div>
      
      {result && (
        <div className="mt-2 text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-lg border">
          {result}
        </div>
      )}
    </div>
  );
}

// Enrich Locations Button Component
function EnrichLocationsButton() {
  const [enriching, setEnriching] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const enrichLocations = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'This will crawl firm websites and attempt to update their location info. Continue?'
    );

    if (!confirmed) {
      return;
    }

    setEnriching(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/enrich-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setResult(
          `✅ Success!\n` +
          `Updated: ${data.updated} profiles\n` +
          `Skipped: ${data.skipped} profiles\n` +
          `Errors: ${data.errors || 0}\n` +
          `Duration: ${data.duration || 'N/A'}`
        );
      } else {
        const error = await response.json();
        setResult(`❌ Error: ${error.error || error.details || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={enrichLocations}
        disabled={enriching}
        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {enriching ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Running...
          </>
        ) : (
          'Enrich Firm Locations'
        )}
      </button>

      {result && (
        <div className="mt-2 text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-lg border">
          {result}
        </div>
      )}
    </div>
  );
}

// Weekly Digest Button Component
function WeeklyDigestButton() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const sendDigest = async (testMode = false) => {
    setSending(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/send-weekly-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testMode,
          testEmail: testMode ? testEmail : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Success! ${data.message}\n` +
          `Jobs included: ${data.jobsCount}\n` +
          `Recipients: ${data.totalRecipients}\n` +
          `Emails sent: ${data.emailsSent}\n` +
          `Emails failed: ${data.emailsFailed}\n` +
          `${data.testMode ? 'Test mode enabled' : ''}`);
      } else {
        const error = await response.json();
        setResult(`❌ Error: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => sendDigest(false)}
          disabled={sending}
          className="inline-flex items-center justify-center rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Weekly Digest'}
        </button>
        <button
          onClick={() => sendDigest(true)}
          disabled={sending}
          className="inline-flex items-center justify-center rounded-xl bg-orange-600 text-white px-4 py-2 text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {sending ? 'Testing...' : 'Test Digest'}
        </button>
      </div>
      
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Test email address"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      
      {result && (
        <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">
          {result}
        </div>
      )}
    </div>
  );
}

// Test Email Button Component
function TestEmailButton() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [profileId, setProfileId] = useState('');

  const testEmail = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      // First check database migration status
      const dbCheck = await fetch('/api/debug/check-db-migration');
      const dbData = await dbCheck.json();
      
      if (!dbData.success) {
        setResult(`❌ Database issue: ${dbData.error}`);
        return;
      }
      
      if (!dbData.migration.column_exists) {
        setResult(`❌ Database migration not run. Column 'notified_verified_listed_at' missing.`);
        return;
      }
      
      // Test email send
      const response = await fetch('/api/debug/test-email-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'koen@cardifftax.com',
          firstName: 'Koen',
          slug: 'test-user'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Success! Email sent to koen@cardifftax.com`);
      } else {
        const error = await response.json();
        setResult(`❌ Error: ${error.error || error.details || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const checkProfile = async () => {
    if (!profileId.trim()) {
      setResult('❌ Please enter a profile ID');
      return;
    }

    setTesting(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/debug/check-profile/${profileId.trim()}`);
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Profile Check:\n` +
          `- ID: ${data.profile.id}\n` +
          `- Name: ${data.profile.first_name}\n` +
          `- Slug: ${data.profile.slug || 'MISSING'}\n` +
          `- Email: ${data.user.email || 'MISSING'}\n` +
          `- Notified: ${data.profile.notified_verified_listed_at || 'Never'}\n` +
          `- Should send: ${data.emailCheck.shouldSendEmail ? 'YES' : 'NO'}\n` +
          `- Reason: ${data.emailCheck.reason}`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <button
          onClick={testEmail}
          disabled={testing}
          className="inline-flex items-center justify-center rounded-xl bg-orange-600 text-white px-4 py-2 text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Send Test Email'}
        </button>
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Profile ID to check"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={checkProfile}
          disabled={testing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
        >
          Check Profile
        </button>
      </div>
      
      {result && (
        <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">
          {result}
        </div>
      )}
    </div>
  );
}

interface AdminStats {
  totalProfiles: number;
  pendingVerifications: number;
  verifiedProfiles: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/admin" className="hover:text-slate-900 font-medium">Admin</Link>
            <Link href="/admin/verify" className="hover:text-slate-900">Verify</Link>
            <Link href="/admin/profiles" className="hover:text-slate-900">Profiles</Link>
            <Link href="/admin/jobs" className="hover:text-slate-900">Jobs</Link>
            <Link href="/admin/job-applications" className="hover:text-slate-900">Applications</Link>
            <Link href="/admin/firms" className="hover:text-slate-900">Enrichment</Link>
            <Link href="/admin/firm-workspaces" className="hover:text-slate-900">Workspaces</Link>
            <Link href="/admin/marketing" className="hover:text-slate-900">Marketing</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Manage profiles, verifications, and platform operations.</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Profiles</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.totalProfiles}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending Verifications</p>
                  <p className="text-2xl font-semibold text-yellow-600">{stats.pendingVerifications}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Verified Profiles</p>
                  <p className="text-2xl font-semibold text-emerald-600">{stats.verifiedProfiles}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="text-2xl font-semibold text-slate-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Review Verifications</h3>
            <p className="text-slate-600 mb-4">Approve or reject pending profile verifications.</p>
            <Link
              href="/admin/verify"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Review Now
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Manage Profiles</h3>
            <p className="text-slate-600 mb-4">View, edit, and manage all user profiles.</p>
            <Link
              href="/admin/profiles"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Manage Profiles
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Test Email</h3>
            <p className="text-slate-600 mb-4">Test the verified + listed email functionality.</p>
            <TestEmailButton />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Weekly Job Digest</h3>
            <p className="text-slate-600 mb-4">Send weekly digest of new jobs to all users with job notifications enabled.</p>
            <WeeklyDigestButton />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Platform Analytics</h3>
            <p className="text-slate-600 mb-4">View platform usage and user statistics.</p>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 text-white px-4 py-2 text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              View Analytics
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Events Management</h3>
            <p className="text-slate-600 mb-4">Refresh events from AI or review events before they go live.</p>
            <EventsRefreshButton />
            <div className="mt-3 flex gap-2">
              <Link 
                href="/admin/events-review"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                📋 Review Events
              </Link>
              <Link 
                href="/admin/add-event"
                className="inline-flex items-center justify-center rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors"
              >
                ➕ Add Event
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Firm Enrichment</h3>
            <p className="text-slate-600 mb-4">Enrich profile firm data with live website information for analytics.</p>
            <div className="space-y-3">
              <Link
                href="/admin/firms"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-600 text-white px-4 py-2 text-sm font-medium hover:bg-cyan-700 transition-colors"
              >
                View Enrichment
              </Link>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-2">Location Enrichment</p>
                <EnrichLocationsButton />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Firm Workspaces</h3>
            <p className="text-slate-600 mb-4">Manage actual firm workspace accounts with team members and subscriptions.</p>
            <Link
              href="/admin/firm-workspaces"
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 text-white px-4 py-2 text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Manage Workspaces
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Job Applications</h3>
            <p className="text-slate-600 mb-4">View and manage all job applications across the platform.</p>
            <Link
              href="/admin/job-applications"
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 text-white px-4 py-2 text-sm font-medium hover:bg-rose-700 transition-colors"
            >
              View Applications
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Manage Jobs</h3>
            <p className="text-slate-600 mb-4">View, edit, and manage all job postings on the platform.</p>
            <Link
              href="/admin/jobs"
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              Manage Jobs
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">HubSpot Sync</h3>
            <p className="text-slate-600 mb-4">Sync all profiles from the database to HubSpot contacts.</p>
            <Link
              href="/admin-sync-hubspot.html"
              target="_blank"
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 text-white px-4 py-2 text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              Sync to HubSpot
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Marketing Email</h3>
            <p className="text-slate-600 mb-4">Send broadcast emails to users via Resend. All sends are logged for tracking.</p>
            <Link
              href="/admin/marketing"
              className="inline-flex items-center justify-center rounded-xl bg-pink-600 text-white px-4 py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
            >
              Send Marketing Email
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            className="bg-white rounded-2xl border border-amber-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Thin Profiles (SEO)</h3>
            <p className="text-slate-600 mb-4">Find profiles with &lt;120 words and send optimization emails to help them improve.</p>
            <Link
              href="/admin/thin-profiles"
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              Manage Thin Profiles
            </Link>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-white rounded-2xl border border-slate-200 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-slate-500">
            <p>Recent admin actions will appear here</p>
          </div>
        </motion.div>
      </div>
    </div>
    </AdminRouteGuard>
  );
}
