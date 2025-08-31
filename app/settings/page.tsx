'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';

interface EmailPreferences {
  job_notifications: boolean;
  application_updates: boolean;
  connection_requests: boolean;
  verification_emails: boolean;
  marketing_updates: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    job_notifications: true,
    application_updates: true,
    connection_requests: true,
    verification_emails: true,
    marketing_updates: false,
    frequency: 'immediate'
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/profile?clerk_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.email_preferences) {
          setPreferences(data.email_preferences);
        }
      } else {
        console.error('Failed to load preferences:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: user.id,
          email_preferences: preferences
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email preferences saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save preferences:', response.status, response.statusText, errorData);
        throw new Error(errorData.error || 'Failed to save preferences');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof EmailPreferences, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/" className="hover:text-slate-900">Home</a>
            <a href="/search" className="hover:text-slate-900">Search</a>
            <a href="/jobs" className="hover:text-slate-900">Jobs</a>
          </nav>
          <UserMenu 
            userName={user.fullName || undefined}
            userEmail={user.primaryEmailAddress?.emailAddress}
          />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
            <p className="text-slate-600">Manage your account preferences and email notifications</p>
          </div>

          {/* Email Preferences Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Email Notifications</h2>
            <p className="text-slate-600 mb-6">
              Choose which emails you'd like to receive and how often. We'll never spam you.
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                <span className="ml-2 text-slate-600">Loading preferences...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Critical Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Critical Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.verification_emails}
                        onChange={(e) => handlePreferenceChange('verification_emails', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      <span className="ml-3 text-slate-700">
                        <strong>Verification emails</strong>
                        <span className="block text-sm text-slate-500">Account verification and status updates</span>
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.application_updates}
                        onChange={(e) => handlePreferenceChange('application_updates', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      <span className="ml-3 text-slate-700">
                        <strong>Application updates</strong>
                        <span className="block text-sm text-slate-500">Status changes on your job applications</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Job Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Job Opportunities</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.job_notifications}
                        onChange={(e) => handlePreferenceChange('job_notifications', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      <span className="ml-3 text-slate-700">
                        <strong>New job notifications</strong>
                        <span className="block text-sm text-slate-500">Jobs that match your criteria and preferences</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Professional Network */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Professional Network</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.connection_requests}
                        onChange={(e) => handlePreferenceChange('connection_requests', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      <span className="ml-3 text-slate-700">
                        <strong>Connection requests</strong>
                        <span className="block text-sm text-slate-500">When someone wants to connect with you</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Marketing & Updates */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Platform Updates</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.marketing_updates}
                        onChange={(e) => handlePreferenceChange('marketing_updates', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      <span className="ml-3 text-slate-700">
                        <strong>Platform updates & newsletters</strong>
                        <span className="block text-sm text-slate-500">New features, tips, and industry insights</span>
                      </span>
                    </label>
                  </div>

                  {preferences.marketing_updates && (
                    <div className="mt-4 ml-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Update frequency
                      </label>
                      <select
                        value={preferences.frequency}
                        onChange={(e) => handlePreferenceChange('frequency', e.target.value as any)}
                        className="block w-full rounded-md border-slate-300 text-slate-900 focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="daily">Daily digest</option>
                        <option value="weekly">Weekly digest</option>
                        <option value="never">Never</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        {preferences.frequency === 'immediate' && 'Receive updates as they happen'}
                        {preferences.frequency === 'daily' && 'Get a daily summary of all updates'}
                        {preferences.frequency === 'weekly' && 'Get a weekly summary of all updates'}
                        {preferences.frequency === 'never' && 'No marketing emails'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          {/* Additional Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <h3 className="font-medium text-slate-900">Profile Information</h3>
                  <p className="text-sm text-slate-600">Update your professional profile and contact details</p>
                </div>
                <a
                  href="/profile/edit"
                  className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                >
                  Edit →
                </a>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <h3 className="font-medium text-slate-900">Verification Status</h3>
                  <p className="text-sm text-slate-600">Check and manage your professional verification</p>
                </div>
                <a
                  href="/profile/verify"
                  className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                >
                  View →
                </a>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-slate-900">Job Applications</h3>
                  <p className="text-sm text-slate-600">Track your job applications and responses</p>
                </div>
                <a
                  href="/profile/applications"
                  className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                >
                  View →
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
