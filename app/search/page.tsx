'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { safeMap, safeLength } from '@/lib/safe';
import { useUser } from '@clerk/nextjs';
import UserMenu from '@/components/UserMenu';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import MobileNav from '@/components/MobileNav';

export const dynamic = 'force-dynamic';

interface Profile {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  headline: string;
  bio: string;
  credential_type: string;
  firm_name: string;
  public_email: string;
  accepting_work: boolean;
  verified: boolean;
  specializations: string[];
  states: string[];
  avatar_url: string | null;
}

interface SearchFilters {
  q: string;
  credential_type: string;
  state: string;
  specialization: string;
  accepting_work: string;
  verified_only: boolean;
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

export default function SearchPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [specializationGroups, setSpecializationGroups] = useState<SpecializationGroup[]>([]);
  const [connectionStates, setConnectionStates] = useState<Record<string, { status: string; connectionId?: string; isRequester?: boolean }>>({});
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render trigger
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    q: '',
    credential_type: '',
    state: '',
    specialization: '',
    accepting_work: '',
    verified_only: true
  });

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  useEffect(() => {
    // Check authentication
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    
    if (user) {
      fetchSpecializations();
      searchProfiles();
    }
  }, [isLoaded, user, router]);

  // Remove automatic search trigger to prevent infinite loops

  const fetchSpecializations = async () => {
    try {
      const response = await fetch('/api/specializations');
      if (response.ok) {
        const data = await response.json();
        setSpecializationGroups(data);
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const searchProfiles = async (customFilters?: SearchFilters) => {
    setLoading(true);
    try {
      const filtersToUse = customFilters || filters;
      const params = new URLSearchParams();
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          // Handle boolean values properly
          if (typeof value === 'boolean') {
            params.append(key, value.toString());
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/search?${params}`);
             const data = await response.json();
       setProfiles(data.profiles || []);
       
       // Check connection status for each profile
       if (data.profiles) {
         data.profiles.forEach((profile: Profile) => {
           checkConnectionStatus(profile.id);
         });
       }
     } catch (error) {
       console.error('Search error:', error);
       setProfiles([]); // Ensure profiles is always an array even on error
     } finally {
       setLoading(false);
     }
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      q: '',
      credential_type: '',
      state: '',
      specialization: '',
      accepting_work: '',
      verified_only: false
    };
    setFilters(clearedFilters);
    // Search with cleared filters
    setTimeout(() => searchProfiles(clearedFilters), 100);
  };

  const handleConnect = async (profileId: string) => {
    console.log('🔄 Connect button clicked for profile:', profileId);
    
    try {
      console.log('📡 Sending connection request...');
      const response = await fetch('/api/connections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientProfileId: profileId })
      });

      console.log('📥 Response received:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connection created successfully:', data);
        // Get the real connection status from the API
        await checkConnectionStatus(profileId);
        console.log('🔄 Connection state updated');
      } else {
        const error = await response.json();
        console.log('❌ Connection failed with error:', error);
        if (error.error === 'Connection already exists') {
          // Update with existing connection status
          setConnectionStates(prev => ({
            ...prev,
            [profileId]: { 
              status: error.connection.status, 
              connectionId: error.connection.id,
              isRequester: error.connection.requester_profile_id === profileId
            }
          }));
          console.log('🔄 Updated with existing connection status');
        } else {
          console.error('Connection failed:', error);
        }
      }
    } catch (error) {
      console.error('💥 Connection error:', error);
    }
  };

  const checkConnectionStatus = async (profileId: string) => {
    try {
      console.log('🔍 Checking connection status for profile:', profileId);
      const response = await fetch(`/api/connections/status?otherProfileId=${profileId}`);
      console.log('📥 Status response:', response.status, response.statusText);
      
             if (response.ok) {
         const data = await response.json();
         console.log('✅ Connection status received:', data);
         setConnectionStates(prev => ({
           ...prev,
           [profileId]: data
         }));
         // Force re-render after state update
         setForceUpdate(prev => prev + 1);
         console.log('🔄 Force re-render triggered');
       } else {
        console.log('❌ Status check failed:', response.status);
      }
    } catch (error) {
      console.error('💥 Status check error:', error);
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connect/${connectionId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'accepted' })
      });

      if (response.ok) {
        // Refresh connection status for all profiles
        if (profiles) {
          profiles.forEach((profile: Profile) => {
            checkConnectionStatus(profile.id);
          });
        }
      } else {
        console.error('Failed to accept connection');
      }
    } catch (error) {
      console.error('Accept connection error:', error);
    }
  };

  const renderSpecializationFilters = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Specializations</h3>
      
      {/* Specialization Search */}
      <div className="relative">
                              <input
                        type="text"
                        placeholder="Search specializations..."
                        value={filters.specialization}
                                                 onChange={(e) => {
                           const newFilters = { ...filters, specialization: e.target.value };
                           setFilters(newFilters);
                           // Auto-search when this filter changes (debounced)
                           if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                           searchTimeoutRef.current = setTimeout(() => searchProfiles(newFilters), 500);
                         }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
        {filters.specialization && (
          <button
            onClick={() => setFilters(prev => ({ ...prev, specialization: '' }))}
            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Quick Filter Buttons for Common Specializations */}
      <div className="space-y-2">
        <p className="text-xs text-slate-600 font-medium">Quick Filters:</p>
        <div className="flex flex-wrap gap-2">
          {['1040_individual', '1120s_s_corp', 'real_estate_investors', 'crypto_defi_nft', 'irs_rep_exams_audits'].map((specSlug) => {
            const spec = specializationGroups.flatMap(group => group.items).find(s => s.slug === specSlug);
            if (!spec) return null;
            return (
              <button
                key={specSlug}
                                 onClick={() => {
                   const newFilters = { ...filters, specialization: specSlug };
                   setFilters(newFilters);
                   setTimeout(() => searchProfiles(newFilters), 100);
                 }}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  filters.specialization === specSlug
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {spec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Specializations (Collapsible) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
          Browse All Specializations
          <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
          {specializationGroups.map((group) => (
            <div key={group.key} className="space-y-2">
              <h4 className="text-xs font-medium text-slate-600 uppercase tracking-wide">{group.label}</h4>
              <div className="grid grid-cols-1 gap-1">
                {group.items.map((spec) => (
                  <label key={spec.slug} className="flex items-center space-x-2 text-xs">
                    <input
                      type="radio"
                      name="specialization"
                      value={spec.slug}
                      checked={filters.specialization === spec.slug}
                                             onChange={(e) => {
                         const newFilters = { ...filters, specialization: e.target.value };
                         setFilters(newFilters);
                         setTimeout(() => searchProfiles(newFilters), 100);
                       }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{spec.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );

  // Show loading state while checking authentication
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/search" className="hover:text-slate-900 font-medium">Search</Link>
            <Link href="/jobs" className="hover:text-slate-900">Jobs</Link>
            {!user && (
              <Link href="/join" className="hover:text-slate-900">Join</Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu 
                userName={user.fullName || undefined}
                userEmail={user.primaryEmailAddress?.emailAddress}
              />
            ) : (
              <Link
                href="/join"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800"
              >
                Join Now
              </Link>
            )}
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Find Tax Professionals</h1>
          <p className="text-slate-600">Search for verified CPAs, EAs, and CTEC preparers by credential, location, and specialization.</p>
          <p className="text-sm text-slate-500 mt-1">
            {filters.verified_only 
              ? "Only verified and listed professionals are shown to ensure quality and accessibility."
              : "Showing all profiles. Unverified profiles are visible but cannot be viewed until verification is complete."
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
                
                {/* Verified Only Switch - Prominently placed at top */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-medium text-blue-900">Verified Pros Only</span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.verified_only}
                        onChange={(e) => {
                          const newFilters = { ...filters, verified_only: e.target.checked };
                          setFilters(newFilters);
                          // Auto-search when this filter changes
                          setTimeout(() => searchProfiles(newFilters), 100);
                        }}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                        filters.verified_only ? 'bg-blue-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                          filters.verified_only ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                  </label>
                </div>

                {/* Search Query */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Name, firm, or keywords..."
                    value={filters.q}
                                         onChange={(e) => {
                       const newFilters = { ...filters, q: e.target.value };
                       setFilters(newFilters);
                       // Auto-search when text changes (debounced)
                       if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                       searchTimeoutRef.current = setTimeout(() => searchProfiles(newFilters), 500);
                     }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Credential Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Credential Type</label>
                  <select
                    value={filters.credential_type}
                                         onChange={(e) => {
                       const newFilters = { ...filters, credential_type: e.target.value };
                       setFilters(newFilters);
                       // Auto-search when this filter changes
                       setTimeout(() => searchProfiles(newFilters), 100);
                     }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All credentials</option>
                    <option value="CPA">CPA</option>
                    <option value="EA">EA</option>
                    <option value="CTEC">CTEC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <select
                    value={filters.state}
                                         onChange={(e) => {
                       const newFilters = { ...filters, state: e.target.value };
                       setFilters(newFilters);
                       // Auto-search when this filter changes
                       setTimeout(() => searchProfiles(newFilters), 100);
                     }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All states</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* Specializations */}
                {renderSpecializationFilters()}

                {/* Accepting Work */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
                  <select
                    value={filters.accepting_work}
                                         onChange={(e) => {
                       const newFilters = { ...filters, accepting_work: e.target.value };
                       setFilters(newFilters);
                       // Auto-search when this filter changes
                       setTimeout(() => searchProfiles(newFilters), 100);
                     }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All profiles</option>
                    <option value="true">Accepting work</option>
                  </select>
                </div>



                {/* Search Button */}
                                 <button
                   onClick={() => searchProfiles()}
                   className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                 >
                   Search
                 </button>

                {/* Clear All Filters */}
                {(filters.q || filters.credential_type || filters.state || filters.specialization || filters.accepting_work || filters.verified_only) && (
                  <button
                                       onClick={() => {
                     const clearedFilters = {
                       q: '',
                       credential_type: '',
                       state: '',
                       specialization: '',
                       accepting_work: '',
                       verified_only: true
                     };
                     setFilters(clearedFilters);
                     setTimeout(() => searchProfiles(clearedFilters), 100);
                   }}
                    className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                <p className="mt-2 text-slate-600">Searching...</p>
              </div>
            ) : !profiles || profiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No professionals found matching your criteria.</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-slate-900 hover:text-slate-700 underline"
                >
                  Try clearing some filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(profiles || []).map((profile, index) => {
                  // Debug: log profile data to see slug issues
                  console.log('Profile data:', { id: profile.id, slug: profile.slug, name: `${profile.first_name} ${profile.last_name}` });
                   
                  return (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {profile.first_name} {profile.last_name}
                          </h3>
                          {profile.verified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Verified
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {profile.credential_type}
                          </span>
                        </div>
                        
                        <p className="text-slate-600 font-medium mb-2">{profile.headline}</p>
                        {profile.firm_name && (
                          <p className="text-slate-500 text-sm mb-2">{profile.firm_name}</p>
                        )}
                        <p className="text-slate-600 text-sm mb-3">{profile.bio}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {safeMap(profile.specializations, spec => {
                            const specLabel = specializationGroups.flatMap(group => group.items).find(s => s.slug === spec)?.label || spec;
                            return (
                              <span
                                key={spec}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                              >
                                {specLabel}
                              </span>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>States: {profile.states ? profile.states.join(', ') : 'Not specified'}</span>
                          <span className={profile.accepting_work ? 'text-emerald-600' : 'text-slate-400'}>
                            {profile.accepting_work ? 'Accepting work' : 'Not accepting work'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {profile.verified ? (
                          <Link
                            href={`/p/${profile.slug || `${profile.first_name}-${profile.last_name}`.toLowerCase().replace(/\s+/g, '-')}`}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
                          >
                            View Profile
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center justify-center rounded-xl bg-slate-300 text-slate-500 px-4 py-2 text-sm font-medium cursor-not-allowed"
                            title="Profile not yet verified - cannot be viewed"
                          >
                            Pending Verification
                          </button>
                        )}
                        
                                                 {profile.accepting_work && (
                           <button 
                             onClick={() => {
                               if (connectionStates[profile.id]?.status === 'pending' && !connectionStates[profile.id]?.isRequester) {
                                 // Accept connection
                                 handleAcceptConnection(connectionStates[profile.id]?.connectionId!);
                               } else {
                                 // Send connection request
                                 console.log('🖱️ Button clicked for profile:', profile.id);
                                 handleConnect(profile.id);
                               }
                             }}
                             disabled={connectionStates[profile.id]?.status === 'accepted'}
                             className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                               connectionStates[profile.id]?.status === 'accepted'
                                 ? 'bg-green-100 text-green-700 border-green-200 cursor-default'
                                 : connectionStates[profile.id]?.status === 'pending'
                                 ? connectionStates[profile.id]?.isRequester ? 'bg-yellow-100 text-yellow-700 border-yellow-200 cursor-default' : 'bg-green-600 text-white hover:bg-green-700'
                                 : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                             }`}
                           >
                             {connectionStates[profile.id]?.status === 'accepted'
                               ? 'Connected'
                               : connectionStates[profile.id]?.status === 'pending'
                               ? connectionStates[profile.id]?.isRequester ? 'Request Sent' : 'Accept Request'
                               : 'Connect'
                             }
                           </button>
                         )}
                        

                        
                        {/* Show Message button for connected users */}
                        {profile.accepting_work && connectionStates[profile.id]?.status === 'accepted' && (
                          <Link
                            href={`/messages/${connectionStates[profile.id]?.connectionId}`}
                            className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors mt-2"
                          >
                            Message
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </div>
  );
}
