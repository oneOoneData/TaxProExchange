'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { safeIncludes, safeMap } from '@/lib/safe';
import UserMenu from '@/components/UserMenu';
import Logo from '@/components/Logo';
import { COUNTRIES, getCountryName } from '@/lib/constants/countries';

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
  public_contact: boolean;
  works_multistate: boolean;
  works_international: boolean;
  countries: string[];
  specializations: string[];
  states: string[];
  software: string[];
  other_software: string[];
}

interface Specialization {
  id: string;
  slug: string;
  label: string;
  group_key: string;
}

interface SpecializationGroup {
  key: string;
  label: string;
  items: Specialization[];
}

const credentialTypes = [
  { value: 'CPA', label: 'CPA (Certified Public Accountant)' },
  { value: 'EA', label: 'EA (Enrolled Agent)' },
  { value: 'CTEC', label: 'CTEC (California Tax Education Council)' },
  { value: 'Other', label: 'Other Tax Professional' }
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
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
    public_contact: false,
    works_multistate: false,
    works_international: false,
    countries: [],
    specializations: [],
    states: [],
    software: [],
    other_software: []
  });
  const [specializationGroups, setSpecializationGroups] = useState<SpecializationGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect unauthenticated users to home
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Load existing profile when signed-in
  useEffect(() => {
    const run = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          const res = await fetch(`/api/profile?clerk_id=${user.id}`);
          
          if (res.ok) {
            const p = await res.json();
            
            // Check if profile data is empty or missing
            if (!p || Object.keys(p).length === 0 || !p.id) {
              try {
                const createResponse = await fetch('/api/profile', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    clerk_id: user.id,
                    first_name: user.firstName || 'New',
                    last_name: user.lastName || 'User',
                    headline: `${user.firstName || 'New'} ${user.lastName || 'User'}`,
                    bio: 'Profile created automatically',
                    credential_type: 'Other',
                    firm_name: '',
                    public_email: user.emailAddresses[0]?.emailAddress || '',
                    phone: '',
                    website_url: '',
                    linkedin_url: '',
                    accepting_work: true,
                    public_contact: false,
                    works_multistate: false,
                    works_international: false,
                    countries: [],
                    specializations: [],
                    states: [],
                    software: [],
                    other_software: []
                  }),
                });
                
                if (createResponse.ok) {
                  // Refresh the page to load the new profile
                  window.location.reload();
                  return;
                } else {
                  console.error('Failed to create basic profile:', createResponse.status);
                }
              } catch (createError) {
                console.error('Error creating basic profile:', createError);
              }
            }
            
            // Check if user needs to accept updated legal documents
            if (p.tos_version || p.privacy_version) {
              const { LEGAL_VERSIONS } = await import('@/lib/legal');
              
              if (p.tos_version !== LEGAL_VERSIONS.TOS || 
                  p.privacy_version !== LEGAL_VERSIONS.PRIVACY) {
                // Redirect to legal consent if versions don't match
                router.push('/legal/consent?redirect=' + encodeURIComponent('/profile/edit'));
                return;
              }
            }
            
            setProfileForm(prev => ({
              ...prev,
              first_name: p.first_name || user.firstName || '',
              last_name:  p.last_name  || user.lastName  || '',
              headline:   p.headline   || '',
              bio:        p.bio        || '',
              credential_type: p.credential_type || '',
              firm_name:  p.firm_name  || '',
              public_email: p.public_email || user.emailAddresses[0]?.emailAddress || '',
              phone:      p.phone      || '',
              website_url: p.website_url || '',
              linkedin_url: p.linkedin_url || '',
              accepting_work: p.accepting_work ?? true,
              public_contact: p.public_contact ?? false,
              works_multistate: p.works_multistate ?? false,
              works_international: p.works_international ?? false,
              countries: p.countries || [],
              specializations: p.specializations || [],
              states:     p.states     || [],
              software:   p.software   || [],
              other_software: p.other_software || []
            }));
          } else {
            console.error('Profile API error:', res.status, res.statusText);
            const errorText = await res.text();
            console.error('Profile API error details:', errorText);
          }
        } catch (e) {
          console.error('Profile fetch error:', e);
          // best-effort fallback
          setProfileForm(prev => ({
            ...prev,
            first_name: user?.firstName ?? '',
            last_name:  user?.lastName  ?? '',
            public_email: user?.emailAddresses[0]?.emailAddress ?? ''
          }));
        }
      }
    };
    run();
  }, [isLoaded, isSignedIn, user, router]);

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
          clerk_id: user?.id,
          ...profileForm
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile update successful:', result);
        
        // Mark onboarding as complete and redirect
        await fetch('/api/mark-onboarding-complete', { method: 'POST' });
        router.push('/');
      } else {
        let msg = `Failed (${response.status})`;
        try { 
          const j = await response.json(); 
          if (j?.error) msg = j.error; 
        } catch { 
          try { 
            msg = await response.text(); 
          } catch {} 
        }
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          errorMessage = 'A profile with this information already exists. Please check your details.';
        } else if (error.message.includes('Database error')) {
          errorMessage = 'Database error occurred. Please try again or contact support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
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

  const clearGroupSpecializations = (groupKey: string) => {
    const groupSpecs = specializationGroups
      .find(g => g.key === groupKey)
      ?.items.map(s => s.slug) || [];
    
    setProfileForm(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => !groupSpecs.includes(s))
    }));
  };

  const clearAllSpecializations = () => {
    setProfileForm(prev => ({
      ...prev,
      specializations: []
    }));
  };

  // Filter specializations based on search term
  const filteredGroups = specializationGroups.map(group => ({
    ...group,
    items: group.items.filter(spec => 
      spec.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

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

  const toggleCountry = (countryCode: string) => {
    setProfileForm(prev => ({
      ...prev,
      countries: prev.countries.includes(countryCode)
        ? prev.countries.filter(c => c !== countryCode)
        : [...prev.countries, countryCode]
    }));
  };

  const handleBackToHome = async () => {
    try {
      await fetch('/api/mark-onboarding-complete', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error);
      router.push('/');
    }
  };



  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Professional Information';
      case 2: return 'Tax Specializations';
      case 3: return 'Service Areas';
      case 4: return 'Software & Tools';
      default: return 'Edit Profile';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Tell us about yourself and your credentials';
      case 2: return 'Select the types of tax work you specialize in';
      case 3: return 'Choose where you can provide services';
      case 4: return 'Select the software and tools you\'re familiar with';
      default: return '';
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await fetch('/api/specializations');
      
      if (response.ok) {
        const data = await response.json();
        setSpecializationGroups(data);
      } else {
        console.error('Specializations API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Specializations API error details:', errorText);
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const renderSpecializationsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Tax Specializations & Areas of Expertise</h2>
        <p className="text-slate-600">Select all the areas where you have expertise and experience</p>
      </div>

      {/* Search Box */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search specializations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute right-3 top-3">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Global Clear All Button */}
      {profileForm.specializations.length > 0 && (
        <div className="text-center">
          <button
            onClick={clearAllSpecializations}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All Specializations
          </button>
        </div>
      )}

      {/* Grouped Specializations */}
      <div className="space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.key} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{group.label}</h3>
              {profileForm.specializations.some(s => 
                group.items.some(item => item.slug === s)
              ) && (
                <button
                  onClick={() => clearGroupSpecializations(group.key)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear Group
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {group.items.map((spec) => (
                <button
                  key={spec.slug}
                  onClick={() => toggleSpecialization(spec.slug)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    profileForm.specializations.includes(spec.slug)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {spec.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Count */}
      <div className="text-center text-sm text-slate-600">
        {profileForm.specializations.length} specialization{profileForm.specializations.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
                      <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Edit Profile</span>
              <button
                onClick={handleBackToHome}
                className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Back to Home
              </button>
            <UserMenu 
              userName={user?.fullName || undefined}
              userEmail={user?.primaryEmailAddress?.emailAddress}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-slate-900' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900">{getStepTitle()}</h1>
            <p className="text-slate-600 mt-2">{getStepDescription()}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8">
          {currentStep === 1 && (
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

              {/* Public Contact Info */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="public_contact"
                  checked={profileForm.public_contact}
                  onChange={(e) => updateForm('public_contact', e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                />
                <label htmlFor="public_contact" className="text-sm font-medium text-slate-700">
                  Make my contact information publicly visible to everyone
                </label>
              </div>
              <p className="text-xs text-slate-500 ml-6">
                When enabled, your email, phone, and LinkedIn will be visible to all visitors. When disabled, only signed-in users can see your contact information.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            renderSpecializationsStep()
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
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
                  <div className="mt-4 max-h-64 overflow-y-auto bg-white border border-slate-300 rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-2">
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

              {/* Multi-State and International Toggles */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="works_multistate"
                    checked={profileForm.works_multistate}
                    onChange={(e) => updateForm('works_multistate', e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                  />
                  <label htmlFor="works_multistate" className="text-sm font-medium text-slate-700">
                    I work in all U.S. states (Multi-State)
                  </label>
                </div>
                <p className="text-xs text-slate-500 ml-6">
                  When enabled, you'll appear in searches for any U.S. state, regardless of individual state selections above.
                </p>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="works_international"
                    checked={profileForm.works_international}
                    onChange={(e) => updateForm('works_international', e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                  />
                  <label htmlFor="works_international" className="text-sm font-medium text-slate-700">
                    I work with international clients
                  </label>
                </div>
                <p className="text-xs text-slate-500 ml-6">
                  When enabled, you'll appear in international searches and can select specific countries below.
                </p>

                {/* Country Selection */}
                {profileForm.works_international && (
                  <div className="ml-6 space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Select Countries Where You Work
                    </label>
                    <p className="text-xs text-slate-500">
                      Choose the countries where you can provide tax services to international clients.
                    </p>
                    <div className="relative">
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-slate-300 rounded-xl bg-white">
                        {profileForm.countries.length === 0 && (
                          <span className="text-slate-400 text-sm">Select countries...</span>
                        )}
                        {profileForm.countries.map((countryCode) => (
                          <span
                            key={countryCode}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg border border-blue-200"
                          >
                            {getCountryName(countryCode)}
                            <button
                              type="button"
                              onClick={() => toggleCountry(countryCode)}
                              className="ml-1 text-blue-400 hover:text-blue-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 max-h-64 overflow-y-auto bg-white border border-slate-300 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-2">
                          {COUNTRIES.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => toggleCountry(country.code)}
                              className={`p-2 text-xs rounded-lg border transition-colors ${
                                profileForm.countries.includes(country.code)
                                  ? 'bg-blue-900 text-white border-blue-900'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                              }`}
                            >
                              {country.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tax Software & Tools You're Comfortable With
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Select the software you're proficient in. This helps other professionals understand your technical capabilities.
                </p>
                
                <div className="max-h-64 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
                </div>
                
                <div className="mt-4">
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
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="rounded-xl border border-slate-300 text-slate-700 px-6 py-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-4">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium shadow hover:bg-slate-800 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium shadow hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
