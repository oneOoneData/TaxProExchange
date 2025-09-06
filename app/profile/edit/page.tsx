'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { safeIncludes, safeMap } from '@/lib/safe';
import UserMenu from '@/components/UserMenu';
import Logo from '@/components/Logo';
import { COUNTRIES, getCountryName } from '@/lib/constants/countries';
import SpecializationPicker from '@/components/SpecializationPicker';
import CredentialSection from '@/components/forms/CredentialSection';

export const dynamic = 'force-dynamic';

interface ProfileForm {
  first_name: string;
  last_name: string;
  headline: string;
  bio: string;
  opportunities: string;
  credential_type: string;
  licenses: any[];
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
  other_software_raw?: string;
  years_experience?: string;
  entity_revenue_range?: string;
  primary_location: {
    country: string;
    state: string | null;
    city: string | null;
    display_name: string | null;
  };
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
  { slug: 'drake', label: 'Drake Tax' },
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
  { slug: 'cch_workstream', label: 'CCH Axcess Workstream' },
  
  // Practice management & workflow
  { slug: 'truss', label: 'Truss' }
];

export default function EditProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showNameRequired, setShowNameRequired] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    headline: '',
    bio: '',
    opportunities: '',
    credential_type: '',
    licenses: [],
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
    other_software: [],
    primary_location: {
      country: 'US',
      state: null,
      city: null,
      display_name: null
    }
  });
  const [specializationGroups, setSpecializationGroups] = useState<SpecializationGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [showWrapUp, setShowWrapUp] = useState(false);

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
            console.log('Profile data loaded:', p);
            
            // Check if profile data is empty or missing
            if (!p || Object.keys(p).length === 0 || !p.id) {
              // No profile exists - user must create one with their real name
              setProfile(null);
              setShowNameRequired(true);
              return;
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
              opportunities: p.opportunities || '',
              credential_type: p.credential_type || '',
              licenses: p.licenses || [],
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
              other_software: p.other_software || [],
              primary_location: p.primary_location || {
                country: 'US',
                state: null,
                city: null,
                display_name: null
              }
            }));
            console.log('Profile form set with credential_type:', p.credential_type);
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
    
    // Validate that user has entered real names (not placeholders)
    const invalidNames = ['New User', 'Unknown', 'User', 'New', 'Test', 'Demo'];
    const firstNameInvalid = invalidNames.includes(profileForm.first_name.trim());
    const lastNameInvalid = invalidNames.includes(profileForm.last_name.trim());
    
    if (firstNameInvalid || lastNameInvalid) {
      alert('Please enter your actual first and last name. Placeholder names like "New User" are not allowed.');
      setLoading(false);
      return;
    }
    
    if (!profileForm.first_name.trim() || !profileForm.last_name.trim()) {
      alert('Please enter both your first and last name.');
      setLoading(false);
      return;
    }
    
    try {
      // Update profile with validation
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: user?.id,
          first_name: profileForm.first_name.trim(),
          last_name: profileForm.last_name.trim(),
          headline: profileForm.headline.trim(),
          bio: profileForm.bio.trim(),
          opportunities: profileForm.opportunities.trim(),
          credential_type: profileForm.credential_type,
          licenses: profileForm.licenses,
          firm_name: profileForm.firm_name.trim(),
          public_email: profileForm.public_email.trim(),
          phone: profileForm.phone.trim(),
          website_url: profileForm.website_url.trim(),
          linkedin_url: profileForm.linkedin_url.trim(),
          accepting_work: profileForm.accepting_work,
          public_contact: profileForm.public_contact,
          works_multistate: profileForm.works_multistate,
          works_international: profileForm.works_international,
          countries: profileForm.countries,
          specializations: profileForm.specializations,
          states: profileForm.states,
          software: profileForm.software,
          other_software: profileForm.other_software,
          primary_location: profileForm.primary_location
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile update successful:', result);
        
        // Mark onboarding as complete and show wrap-up screen
        await fetch('/api/mark-onboarding-complete', { method: 'POST' });
        setShowWrapUp(true);
      } else {
        let msg = `Failed (${response.status})`;
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        try { 
          const responseText = await response.text();
          console.log('Raw response text:', responseText);
          
          const j = JSON.parse(responseText);
          console.log('Parsed JSON response:', j);
          
          if (j?.error) {
            msg = j.error;
            // If there are detailed validation errors, show them
            if (j.details && j.details.fieldErrors) {
              const fieldErrors = Object.entries(j.details.fieldErrors)
                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                .join('\n');
              msg = `Validation failed:\n${fieldErrors}`;
            }
          }
        } catch (parseError) { 
          console.error('JSON parse error:', parseError);
          try { 
            msg = await response.text(); 
            console.log('Fallback text response:', msg);
          } catch (textError) {
            console.error('Text parse error:', textError);
            msg = `Failed to parse response (${response.status})`;
          }
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
      
      // Show validation errors in a more user-friendly way
      if (errorMessage.includes('Validation failed:')) {
        // For validation errors, show them in a more readable format
        const lines = errorMessage.split('\n');
        const mainError = lines[0];
        const fieldErrors = lines.slice(1).join('\n');
        alert(`${mainError}\n\nPlease check the following fields:\n${fieldErrors}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof ProfileForm, value: any) => {
    setProfileForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Special handling for works_multistate: auto-select all states when enabled
      if (field === 'works_multistate' && value === true) {
        updated.states = [...states]; // Select all states
      }
      
      return updated;
    });
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

  // Filter states based on search term
  const filteredStates = states.filter(state => 
    state.toLowerCase().includes(stateSearchTerm.toLowerCase())
  );

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
      {/* Years of Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years of Tax Experience <span className="text-red-500">*</span>
        </label>
        <select
          value={profileForm.years_experience || ''}
          onChange={(e) => updateForm('years_experience', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select years of experience</option>
          <option value="1-2">1-2 years</option>
          <option value="3-5">3-5 years</option>
          <option value="6-10">6-10 years</option>
          <option value="11-15">11-15 years</option>
          <option value="16-20">16-20 years</option>
          <option value="21-25">21-25 years</option>
          <option value="26-30">26-30 years</option>
          <option value="31+">31+ years</option>
        </select>
      </div>

      {/* Entity Revenue Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Average Annual Revenue of Entity Clients (Optional)
        </label>
        <select
          value={profileForm.entity_revenue_range || ''}
          onChange={(e) => updateForm('entity_revenue_range', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select revenue range (optional)</option>
          <option value="< $1M">Less than $1M</option>
          <option value="$1M - $10M">$1M - $10M</option>
          <option value="$10M - $50M">$10M - $50M</option>
          <option value="$50M - $100M">$50M - $100M</option>
          <option value="$100M - $500M">$100M - $500M</option>
          <option value="$500M - $1B">$500M - $1B</option>
          <option value="> $1B">Greater than $1B</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          This helps clients understand the size of entities you typically work with
        </p>
      </div>

      <SpecializationPicker
        selected={profileForm.specializations}
        onToggle={toggleSpecialization}
        onClear={clearAllSpecializations}
        title="Tax Specializations & Areas of Expertise"
        subtitle="Select all the areas where you have expertise and experience"
      />
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

  // Show name required form if no profile exists
  if (showNameRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
              <p className="text-slate-600">Please enter your name to get started</p>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!profileForm.first_name.trim() || !profileForm.last_name.trim()) {
                alert('Please enter both first and last name');
                return;
              }
              
              try {
                setLoading(true);
                const response = await fetch('/api/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    clerk_id: user?.id,
                    first_name: profileForm.first_name.trim(),
                    last_name: profileForm.last_name.trim(),
                    headline: `${profileForm.first_name.trim()} ${profileForm.last_name.trim()}`,
                    bio: 'Profile created automatically',
                    credential_type: 'Other',
                    firm_name: '',
                    public_email: user?.emailAddresses[0]?.emailAddress || '',
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
                  })
                });
                
                if (response.ok) {
                  window.location.reload();
                } else {
                  const error = await response.json();
                  alert(error.error || 'Failed to create profile');
                }
              } catch (error) {
                alert('Failed to create profile. Please try again.');
              } finally {
                setLoading(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                      ['New User', 'Unknown', 'User', 'New', 'Test', 'Demo'].includes(profileForm.first_name.trim()) 
                        ? 'border-red-300 focus:ring-red-300 bg-red-50' 
                        : 'border-slate-300 focus:ring-slate-300'
                    }`}
                    placeholder="Enter your first name"
                  />
                  {['New User', 'Unknown', 'User', 'New', 'Test', 'Demo'].includes(profileForm.first_name.trim()) && (
                    <p className="text-red-600 text-xs mt-1">Please enter your actual first name</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.last_name}
                    onChange={(e) => updateForm('last_name', e.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                      ['New User', 'Unknown', 'User', 'New', 'Test', 'Demo'].includes(profileForm.last_name.trim()) 
                        ? 'border-red-300 focus:ring-red-300 bg-red-50' 
                        : 'border-slate-300 focus:ring-slate-300'
                    }`}
                    placeholder="Enter your last name"
                  />
                  {['New User', 'Unknown', 'User', 'New', 'Test', 'Demo'].includes(profileForm.last_name.trim()) && (
                    <p className="text-red-600 text-xs mt-1">Please enter your actual last name</p>
                  )}
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

              {/* Opportunities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Opportunities & Expertise Goals</label>
                <textarea
                  value={profileForm.opportunities}
                  onChange={(e) => updateForm('opportunities', e.target.value)}
                  placeholder="What opportunities are you open for? What expertise are you hoping to gain? (e.g., 'Looking for partnership opportunities', 'Want to learn international tax', 'Open to consulting projects')"
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Help others understand what you're looking for and what you can offer
                </p>
              </div>

              {/* Credentials Section */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Professional Credentials</label>
                <CredentialSection
                  value={{
                    credential_type: profileForm.credential_type as any,
                    licenses: profileForm.licenses
                  }}
                  onChange={(credentialData) => {
                    updateForm('credential_type', credentialData.credential_type);
                    updateForm('licenses', credentialData.licenses);
                  }}
                />
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
                    type="text"
                    value={profileForm.website_url}
                    onChange={(e) => updateForm('website_url', e.target.value)}
                    placeholder="yourwebsite.com or https://yourwebsite.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    https:// will be added automatically if missing
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn</label>
                  <input
                    type="text"
                    value={profileForm.linkedin_url}
                    onChange={(e) => updateForm('linkedin_url', e.target.value)}
                    placeholder="linkedin.com/in/yourprofile or https://linkedin.com/in/yourprofile"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    https:// will be added automatically if missing
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Primary Location *</label>
                <p className="text-xs text-slate-500 mb-3">
                  Where are you primarily located? This helps clients find professionals in their area.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Country *</label>
                    <select
                      required
                      value={profileForm.primary_location.country}
                      onChange={(e) => updateForm('primary_location', {
                        ...profileForm.primary_location,
                        country: e.target.value
                      })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">State/Province</label>
                    <input
                      type="text"
                      value={profileForm.primary_location.state || ''}
                      onChange={(e) => updateForm('primary_location', {
                        ...profileForm.primary_location,
                        state: e.target.value || null
                      })}
                      placeholder="CA, NY, TX, etc."
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                    <input
                      type="text"
                      value={profileForm.primary_location.city || ''}
                      onChange={(e) => updateForm('primary_location', {
                        ...profileForm.primary_location,
                        city: e.target.value || null
                      })}
                      placeholder="San Diego, New York, etc."
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
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
                
                {/* State Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search states..."
                    value={stateSearchTerm}
                    onChange={(e) => setStateSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                  />
                </div>
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
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Available States
                      </label>
                      <p className="text-xs text-slate-500">
                        Click to select/deselect states where you work
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {filteredStates.map((state) => (
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
                  When enabled, you'll appear in searches for any U.S. state and all states will be automatically selected above.
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
                    value={profileForm.other_software_raw !== undefined ? profileForm.other_software_raw : (profileForm.other_software ? profileForm.other_software.join(', ') : '')}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    onChange={(e) => {
                      // Store the raw input value temporarily
                      setProfileForm(prev => ({ ...prev, other_software_raw: e.target.value }));
                    }}
                    onBlur={(e) => {
                      // Process the input when user finishes typing
                      const otherSoftware = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      updateForm('other_software', otherSoftware);
                      // Clear the raw input
                      setProfileForm(prev => ({ ...prev, other_software_raw: undefined }));
                    }}
                    onKeyDown={(e) => {
                      // Process on Enter key as well
                      if (e.key === 'Enter') {
                        const otherSoftware = e.currentTarget.value.split(',').map(s => s.trim()).filter(s => s);
                        updateForm('other_software', otherSoftware);
                        // Clear the raw input
                        setProfileForm(prev => ({ ...prev, other_software_raw: undefined }));
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Type software names separated by commas. Press Enter or click outside to save.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Wrap-up Screen */}
          {showWrapUp && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-3xl p-8 max-w-2xl mx-4 text-center">
                <div className="mb-8">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-semibold text-slate-900 mb-4">
                    Profile Complete! 🎉
                  </h2>
                  <p className="text-slate-600">
                    Your professional profile has been saved successfully. Here's what happens next:
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-medium text-slate-900 mb-3">Next Steps:</h3>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1">1.</span>
                      <span><strong>Wait for Verification:</strong> Your profile will be reviewed by our team (usually within 24-48 hours)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1">2.</span>
                      <span><strong>Explore Other Profiles:</strong> Search and connect with other tax professionals on the platform</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1">3.</span>
                      <span><strong>Check Out Jobs:</strong> Browse available opportunities in the job board</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1">4.</span>
                      <span><strong>Get Notified:</strong> You'll receive an email when your profile is verified and goes live</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => router.push('/search')}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Explore Profiles
                  </button>
                  <button
                    onClick={() => router.push('/jobs')}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Browse Jobs
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Go Home
                  </button>
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
                  disabled={loading || ['New User', 'Unknown', 'User', 'New', 'Test', 'Demo'].includes(profileForm.first_name.trim()) || ['New User', 'Unknown', 'User', 'New', 'Test', 'Demo'].includes(profileForm.last_name.trim())}
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
