'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ProfileForm {
  first_name: string;
  last_name: string;
  headline: string;
  bio: string;
  credential_type: string;
  firm_name: string;
  public_email: string;
  phone: string;
  website_url: string;
  linkedin_url: string;
  accepting_work: boolean;
  specializations: string[];
  states: string[];
}

const credentialTypes = [
  { value: 'CPA', label: 'CPA (Certified Public Accountant)' },
  { value: 'EA', label: 'EA (Enrolled Agent)' },
  { value: 'CTEC', label: 'CTEC (California Tax Education Council)' },
  { value: 'Other', label: 'Other Tax Professional' }
];

const specializations = [
  { slug: 's_corp', label: 'S-Corporation' },
  { slug: 'multi_state', label: 'Multi-State' },
  { slug: 'real_estate', label: 'Real Estate' },
  { slug: 'crypto', label: 'Cryptocurrency' },
  { slug: 'irs_rep', label: 'IRS Representation' },
  { slug: '1040', label: 'Individual Returns' },
  { slug: 'business', label: 'Business Returns' },
  { slug: 'partnership', label: 'Partnership Returns' },
  { slug: 'estate_tax', label: 'Estate & Gift Tax' },
  { slug: 'international', label: 'International Tax' }
];

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function JoinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<'auth' | 'profile' | 'credentials' | 'complete'>('auth');
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    headline: '',
    bio: '',
    credential_type: '',
    firm_name: '',
    public_email: '',
    phone: '',
    website_url: '',
    linkedin_url: '',
    accepting_work: true,
    specializations: [],
    states: []
  });

  useEffect(() => {
    if (session?.user) {
      setStep('profile');
      // Pre-fill form with session data
      if (session?.user?.name) {
        const [first, ...lastParts] = session.user.name.split(' ');
        setProfileForm(prev => ({
          ...prev,
          first_name: first ?? '',
          last_name: lastParts.join(' ') ?? '',
          public_email: session?.user?.email ?? ''
        }));
      }
    }
  }, [session]);

  const handleSignIn = async (provider: 'google' | 'linkedin') => {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl: '/join' });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        setStep('credentials');
      } else {
        throw new Error('Failed to create profile');
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('complete');
    // In a real app, this would submit credentials for verification
  };

  const updateForm = (field: keyof ProfileForm, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialization = (slug: string) => {
    setProfileForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(slug)
        ? prev.specializations.filter(s => s !== slug)
        : [...prev.specializations, slug]
    }));
  };

  const toggleState = (state: string) => {
    setProfileForm(prev => ({
      ...prev,
      states: prev.states.includes(state)
        ? prev.states.filter(s => s !== state)
        : [...prev.states, state]
    }));
  };

  if (status === 'loading') {
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
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">TX</span>
            <span className="font-semibold text-slate-900">TaxProExchange</span>
          </Link>
          {session && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Welcome, {session.user?.name || 'User'}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['auth', 'profile', 'credentials', 'complete'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName 
                    ? 'bg-slate-900 text-white' 
                    : step === 'complete' || ['auth', 'profile', 'credentials'].indexOf(step) > index
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step === 'complete' || ['auth', 'profile', 'credentials'].indexOf(step) > index ? '✓' : index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    ['auth', 'profile', 'credentials'].indexOf(step) > index ? 'bg-emerald-200' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-slate-600">
            {step === 'auth' && 'Sign in to get started'}
            {step === 'profile' && 'Create your professional profile'}
            {step === 'credentials' && 'Submit credentials for verification'}
            {step === 'complete' && 'Profile submitted for review'}
          </div>
        </div>

        {/* Auth Step */}
        {step === 'auth' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 p-8 text-center"
          >
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">Join TaxProExchange</h1>
            <p className="text-slate-600 mb-8">
              Connect with other tax professionals. Create your verified profile and start collaborating.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => handleSignIn('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <button
                onClick={() => handleSignIn('linkedin')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0077B5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Continue with LinkedIn
              </button>
            </div>
            
            <p className="mt-6 text-xs text-slate-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        )}

        {/* Profile Step */}
        {step === 'profile' && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleProfileSubmit}
            className="bg-white rounded-3xl border border-slate-200 p-8"
          >
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Create Your Profile</h2>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.first_name}
                    onChange={(e) => updateForm('first_name', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.last_name}
                    onChange={(e) => updateForm('last_name', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Professional Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CPA • S-Corp & Multi-State"
                  value={profileForm.headline}
                  onChange={(e) => updateForm('headline', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bio *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us about your experience and what you specialize in..."
                  value={profileForm.bio}
                  onChange={(e) => updateForm('bio', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Credential Type *</label>
                <select
                  required
                  value={profileForm.credential_type}
                  onChange={(e) => updateForm('credential_type', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">Select your credential</option>
                  {credentialTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Firm Name</label>
                <input
                  type="text"
                  placeholder="Your firm or company name"
                  value={profileForm.firm_name}
                  onChange={(e) => updateForm('firm_name', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Public Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Email for professional inquiries"
                  value={profileForm.public_email}
                  onChange={(e) => updateForm('public_email', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={profileForm.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={profileForm.website_url}
                  onChange={(e) => updateForm('website_url', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={profileForm.linkedin_url}
                  onChange={(e) => updateForm('linkedin_url', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profileForm.accepting_work}
                    onChange={(e) => updateForm('accepting_work', e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">I am currently accepting new work</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Specializations *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {specializations.map(spec => (
                    <label key={spec.slug} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profileForm.specializations.includes(spec.slug)}
                        onChange={() => toggleSpecialization(spec.slug)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                      />
                      <span className="text-sm text-slate-700">{spec.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">States You Work In *</label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                  {states.map(state => (
                    <label key={state} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profileForm.states.includes(state)}
                        onChange={() => toggleState(state)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                      />
                      <span className="text-sm text-slate-700">{state}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 text-white px-8 py-3 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Profile...' : 'Continue to Credentials'}
              </button>
            </div>
          </motion.form>
        )}

        {/* Credentials Step */}
        {step === 'credentials' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 p-8"
          >
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Submit Credentials</h2>
            <p className="text-slate-600 mb-6">
              To verify your professional status, please provide your license or credential information.
              This will be reviewed by our team before your profile goes live.
            </p>
            
            <div className="bg-slate-50 rounded-2xl p-6 mb-6">
              <h3 className="font-medium text-slate-900 mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• We'll review your credentials within 2-3 business days</li>
                <li>• You'll receive an email when verification is complete</li>
                <li>• Once verified, your profile will be visible in search results</li>
                <li>• You can start connecting with other tax professionals</li>
              </ul>
            </div>

            <button
              onClick={handleCredentialSubmit}
              className="w-full rounded-xl bg-slate-900 text-white px-8 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Submit for Verification
            </button>
          </motion.div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 p-8 text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Profile Submitted!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for joining TaxProExchange. Your profile has been submitted for verification.
              We'll review your credentials and notify you via email within 2-3 business days.
            </p>
            
            <div className="space-y-3">
              <Link
                href="/search"
                className="inline-block w-full rounded-xl bg-slate-900 text-white px-8 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Browse Other Professionals
              </Link>
              <Link
                href="/"
                className="inline-block w-full rounded-xl border border-slate-300 text-slate-700 px-8 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
