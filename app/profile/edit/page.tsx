'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeIncludes, safeMap } from '@/lib/safe';

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
  software: string[];
  other_software: string[];
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

const softwareOptions = [
  // Consumer tax prep
  { slug: 'turbotax', label: 'TurboTax' },
  { slug: 'hr_block', label: 'H&R Block Online' },
  { slug: 'taxact', label: 'TaxAct' },
  { slug: 'taxslayer', label: 'TaxSlayer' },
  { slug: 'freetaxusa', label: 'FreeTaxUSA' },
  { slug: 'cash_app_taxes', label: 'Cash App Taxes' },
  
  // Professional preparer suites
  { slug: 'lacerte', label: 'Intuit Lacerte' },
  { slug: 'proseries', label: 'Intuit ProSeries' },
  { slug: 'drake_tax', label: 'Drake Tax' },
  { slug: 'ultratax', label: 'Thomson Reuters UltraTax CS' },
  { slug: 'cch_axcess', label: 'CCH Axcess Tax' },
  { slug: 'cch_prosystem', label: 'CCH ProSystem fx Tax' },
  { slug: 'atx', label: 'ATX' },
  { slug: 'taxwise', label: 'TaxWise' },
  { slug: 'canopy', label: 'Canopy' },
  { slug: 'taxdome', label: 'TaxDome' },
  
  // Corporate & enterprise
  { slug: 'corptax', label: 'CSC Corptax' },
  { slug: 'onesource', label: 'Thomson Reuters ONESOURCE' },
  { slug: 'longview', label: 'Wolters Kluwer Longview Tax' },
  { slug: 'oracle_tax', label: 'Oracle Tax Reporting Cloud' },
  
  // Indirect tax & sales tax
  { slug: 'avalara', label: 'Avalara' },
  { slug: 'vertex', label: 'Vertex (O Series)' },
  { slug: 'sovos', label: 'Sovos' },
  { slug: 'taxjar', label: 'TaxJar' },
  { slug: 'stripe_tax', label: 'Stripe Tax' },
  
  // Payroll & employer
  { slug: 'adp', label: 'ADP' },
  { slug: 'paychex', label: 'Paychex' },
  { slug: 'gusto', label: 'Gusto' },
  { slug: 'quickbooks_payroll', label: 'QuickBooks Payroll' },
  { slug: 'rippling', label: 'Rippling' },
  
  // Information returns
  { slug: 'track1099', label: 'Track1099' },
  { slug: 'tax1099', label: 'Tax1099 (Zenwork)' },
  { slug: 'yearli', label: 'Yearli (Greatland)' },
  { slug: 'efile4biz', label: 'efile4Biz' },
  
  // Crypto tax
  { slug: 'cointracker', label: 'CoinTracker' },
  { slug: 'koinly', label: 'Koinly' },
  { slug: 'coinledger', label: 'CoinLedger' },
  { slug: 'taxbit', label: 'TaxBit' },
  { slug: 'zenledger', label: 'ZenLedger' },
  
  // Fixed assets & depreciation
  { slug: 'bloomberg_fixed_assets', label: 'Bloomberg Tax Fixed Assets' },
  { slug: 'sage_fixed_assets', label: 'Sage Fixed Assets' },
  { slug: 'cch_fixed_assets', label: 'CCH ProSystem fx Fixed Assets' },
  
  // Tax research & content
  { slug: 'checkpoint', label: 'Thomson Reuters Checkpoint' },
  { slug: 'cch_intelliconnect', label: 'CCH IntelliConnect' },
  { slug: 'bloomberg_tax', label: 'Bloomberg Tax & Accounting' },
  { slug: 'lexisnexis_tax', label: 'LexisNexis Tax' },
  { slug: 'taxnotes', label: 'TaxNotes' },
  
  // Workpapers & engagement
  { slug: 'caseware', label: 'CaseWare Working Papers' },
  { slug: 'workiva', label: 'Workiva' },
  { slug: 'sureprep', label: 'SurePrep' },
  { slug: 'cch_workstream', label: 'CCH Axcess Workstream' }
];

export default function EditProfilePage() {
  // Check if we're in build mode (no Clerk environment variables)
  const isBuildTime = typeof process !== 'undefined' && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Use Clerk hooks when available, fallback to local state
  const clerkUser = isBuildTime ? { user: null, isLoaded: false } : useUser();
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
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
    states: [],
    software: [],
    other_software: []
  });

  // Load user data from Clerk when available
  useEffect(() => {
    if (clerkUser.user && clerkUser.isLoaded) {
      setUser(clerkUser.user);
      setIsLoaded(true);
    }
    // Don't auto-redirect unauthenticated users - let them see the page and handle auth naturally
  }, [clerkUser.user, clerkUser.isLoaded]);

  // Load existing profile data when component mounts
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (clerkUser.user && clerkUser.isLoaded) {
        try {
          const response = await fetch(`/api/profile?clerk_id=${clerkUser.user.id}`);
          if (response.ok) {
            const profileData = await response.json();
            setProfileForm(prev => ({
              ...prev,
              first_name: profileData.first_name || clerkUser.user.firstName || '',
              last_name: profileData.last_name || clerkUser.user.lastName || '',
              headline: profileData.headline || '',
              bio: profileData.bio || '',
              credential_type: profileData.credential_type || '',
              firm_name: profileData.firm_name || '',
              public_email: profileData.public_email || clerkUser.user.emailAddresses[0]?.emailAddress || '',
              phone: profileData.phone || '',
              website_url: profileData.website_url || '',
              linkedin_url: profileData.linkedin_url || '',
              accepting_work: profileData.accepting_work ?? true,
              specializations: profileData.specializations || [],
              states: profileData.states || [],
              software: profileData.software || [],
              other_software: profileData.other_software || []
            }));
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          // Fallback to basic user data
          setProfileForm(prev => ({
            ...prev,
            first_name: clerkUser.user.firstName ?? '',
            last_name: clerkUser.user.lastName ?? '',
            public_email: clerkUser.user.emailAddresses[0]?.emailAddress ?? ''
          }));
        }
      }
    };

    loadExistingProfile();
  }, [clerkUser.user, clerkUser.isLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: clerkUser.user?.id,
          ...profileForm
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile update successful:', result);
        alert('Profile updated successfully!');
        // Navigate back to home page
        router.push('/');
      } else {
        const errorData = await response.json();
        console.error('Profile update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof ProfileForm, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialization = (specSlug: string) => {
    setProfileForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specSlug)
        ? prev.specializations.filter(s => s !== specSlug)
        : [...prev.specializations, specSlug]
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

  const toggleSoftware = (softwareSlug: string) => {
    setProfileForm(prev => ({
      ...prev,
      software: prev.software.includes(softwareSlug)
        ? prev.software.filter(s => s !== softwareSlug)
        : [...prev.software, softwareSlug]
    }));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!clerkUser.isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!clerkUser.user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">Sign In Required</h1>
          <p className="text-slate-600 mb-6">
            You need to be signed in to edit your profile.
          </p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium shadow hover:bg-slate-800 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                     <button onClick={() => router.push('/')} className="flex items-center gap-2 cursor-pointer">
             <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">TX</span>
             <span className="font-semibold text-slate-900">TaxProExchange</span>
           </button>
                     <div className="flex items-center gap-4">
             <span className="text-sm text-slate-600">Edit Profile</span>
             <button
               onClick={() => router.push('/')}
               className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
             >
               Back to Home
             </button>
           </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-6">Edit Your Profile</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Headline */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Professional Headline *</label>
              <input
                type="text"
                required
                value={profileForm.headline}
                onChange={(e) => updateForm('headline', e.target.value)}
                placeholder="e.g., Senior Tax Consultant, S-Corp Specialist"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Professional Bio *</label>
              <textarea
                required
                value={profileForm.bio}
                onChange={(e) => updateForm('bio', e.target.value)}
                placeholder="Tell us about your experience, expertise, and what you're looking for..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              />
            </div>

            {/* Credential Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Credential Type *</label>
              <select
                required
                value={profileForm.credential_type}
                onChange={(e) => updateForm('credential_type', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">Select your credential</option>
                {credentialTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Firm Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Firm Name</label>
              <input
                type="text"
                value={profileForm.firm_name}
                onChange={(e) => updateForm('firm_name', e.target.value)}
                placeholder="Your firm or company name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Public Email *</label>
                <input
                  type="email"
                  required
                  value={profileForm.public_email}
                  onChange={(e) => updateForm('public_email', e.target.value)}
                  placeholder="Email for professional inquiries"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="Professional phone number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Website & LinkedIn */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                <input
                  type="url"
                  value={profileForm.website_url}
                  onChange={(e) => updateForm('website_url', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={profileForm.linkedin_url}
                  onChange={(e) => updateForm('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

             {/* Accepting Work */}
             <div className="flex items-center gap-3">
               <input
                 type="checkbox"
                 id="accepting_work"
                 checked={profileForm.accepting_work}
                 onChange={(e) => updateForm('accepting_work', e.target.checked)}
                 className="rounded border-slate-300 text-slate-900 focus:ring-slate-300"
               />
               <label htmlFor="accepting_work" className="text-sm font-medium text-slate-700">
                 I am currently accepting new work and collaborations
               </label>
             </div>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tax Specializations & Areas of Expertise
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Select the types of tax work you specialize in and want to do.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {specializations.map((spec) => (
                    <button
                      key={spec.slug}
                      type="button"
                      onClick={() => toggleSpecialization(spec.slug)}
                      className={`p-2 rounded-lg text-xs border transition-colors ${
                        safeIncludes(profileForm.specializations, spec.slug)
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {spec.label}
                    </button>
                  ))}
                </div>
                
              </div>

                                                                                                                                                                                   {/* States */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      States Where You Work
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Select the states where you're licensed to practice or can handle tax work.
                    </p>
                    <div className="relative">
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-slate-300 rounded-xl bg-white">
                        {profileForm.states.length === 0 && (
                          <span className="text-slate-400 text-sm">Select states...</span>
                        )}
                        {profileForm.states.map((state) => (
                          <span
                            key={state}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg border border-slate-200"
                          >
                            {state}
                            <button
                              type="button"
                              onClick={() => toggleState(state)}
                              className="ml-1 text-slate-400 hover:text-slate-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-300 rounded-xl shadow-lg z-50">
                        <div className="p-2">
                          <input
                            type="text"
                            placeholder="Search states..."
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-300 focus:outline-none mb-2"
                            onChange={(e) => {
                              const searchTerm = e.target.value.toLowerCase();
                              // You could add state filtering logic here if needed
                            }}
                          />
                          <div className="grid grid-cols-3 gap-1">
                            {states.map((state) => (
                              <button
                                key={state}
                                type="button"
                                onClick={() => toggleState(state)}
                                className={`p-2 text-xs rounded-lg border transition-colors ${
                                  profileForm.states.includes(state)
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                                }`}
                              >
                                {state}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add extra spacing to prevent overlap */}
                  <div className="mb-12">                   </div>

                   {/* Add extra spacing to prevent overlap */}
                   <div className="mb-16"></div>

                                                         {/* Software Proficiency */}
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-3">
                   Tax Software & Tools You're Comfortable With
                 </label>
                 <p className="text-xs text-slate-500 mb-3">
                   Select the software you're proficient in. This helps other professionals understand your technical capabilities.
                 </p>
                 
                 {/* Software Search */}
                 <div className="mb-3">
                   <input
                     type="text"
                     placeholder="Search software..."
                     className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-300 focus:outline-none"
                     onChange={(e) => {
                       const searchTerm = e.target.value.toLowerCase();
                       // You could add software filtering logic here if needed
                     }}
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                   {softwareOptions.map((software) => (
                     <button
                       key={software.slug}
                       type="button"
                       onClick={() => toggleSoftware(software.slug)}
                       className={`p-2 rounded-lg text-xs border transition-colors ${
                         safeIncludes(profileForm.software, software.slug)
                           ? 'bg-slate-900 text-white border-slate-900'
                           : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                       }`}
                     >
                       {software.label}
                     </button>
                   ))}
                 </div>
                 
                 <div className="mt-3">
                   <label className="block text-sm font-medium text-slate-700 mb-2">Other Software (comma-separated)</label>
                   <input
                     type="text"
                     placeholder="e.g., Custom in-house tools, specialized software, etc."
                     value={profileForm.other_software ? profileForm.other_software.join(', ') : ''}
                     className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                     onChange={(e) => {
                       const otherSoftware = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                       updateForm('other_software', otherSoftware);
                     }}
                   />
                 </div>
               </div>

                         <div className="mt-8 flex justify-end gap-4">
               <button
                 type="button"
                 onClick={() => router.push('/')}
                 className="rounded-xl border border-slate-300 text-slate-700 px-6 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
               >
                 Cancel
               </button>
               <button
                 type="submit"
                 disabled={loading}
                 className="rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium shadow hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 {loading ? 'Updating...' : 'Update Profile'}
               </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
}
