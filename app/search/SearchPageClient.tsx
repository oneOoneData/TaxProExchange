'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { safeMap, safeLength } from '@/lib/safe';
import { useUser } from '@clerk/nextjs';
import UserMenu from '@/components/UserMenu';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppMobileNav from '@/components/AppMobileNav';
import { getLocationDisplay } from '@/lib/utils/countryFlags';

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
  software: string[];
  avatar_url: string | null;
  years_experience?: string;
  primary_location?: { country?: string; state?: string; city?: string; display_name?: string } | null;
  works_multistate?: boolean;
  works_international?: boolean;
  countries?: string[];
  profile_type?: 'tax_professional' | 'firm_admin';
}

interface SearchFilters {
  q: string;
  credential_type: string;
  state: string;
  specialization: string[];
  software: string;
  accepting_work: string;
  verified_only: boolean;
  years_experience: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export default function SearchPageClient() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [specializationGroups, setSpecializationGroups] = useState<SpecializationGroup[]>([]);
  const [connectionStates, setConnectionStates] = useState<Record<string, { status: string; connectionId?: string; isRequester?: boolean }>>({});
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render trigger
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<SearchFilters>({
    q: '',
    credential_type: '',
    state: '',
    specialization: [],
    software: '',
    accepting_work: '',
    verified_only: true,
    years_experience: ''
  });

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const yearsExperienceOptions = [
    { value: '', label: 'All experience levels' },
    { value: '1-2', label: '1-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '6-10', label: '6-10 years' },
    { value: '11-15', label: '11-15 years' },
    { value: '16-20', label: '16-20 years' },
    { value: '21-25', label: '21-25 years' },
    { value: '26-30', label: '26-30 years' },
    { value: '31+', label: '31+ years' }
  ];

  const softwareOptions = [
    { value: '', label: 'All software' },
    { value: 'proseries', label: 'ProSeries' },
    { value: 'proconnect', label: 'ProConnect' },
    { value: 'drake', label: 'Drake Tax' },
    { value: 'turbotax', label: 'TurboTax' },
    { value: 'lacerte', label: 'Lacerte' },
    { value: 'ultratax', label: 'UltraTax' },
    { value: 'axcess', label: 'Axcess' },
    { value: 'atx', label: 'ATX' },
    { value: 'prosystemfx', label: 'ProSystemFX' },
    { value: 'taxact', label: 'TaxAct' },
    { value: 'taxslayer', label: 'TaxSlayer' },
    { value: 'taxdome', label: 'TaxDome' },
    { value: 'canopy', label: 'Canopy' },
    { value: 'quickbooks_online', label: 'QuickBooks Online' },
    { value: 'xero', label: 'Xero' },
    { value: 'freshbooks', label: 'FreshBooks' },
    { value: 'truss', label: 'Truss' }
  ];

  // Check for unread messages
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkUnreadMessages = async () => {
      try {
        const response = await fetch('/api/messages/unread');
        if (response.ok) {
          const data = await response.json();
          setHasUnreadMessages(data.hasUnreadMessages);
          setUnreadCount(data.unreadCount);
        } else if (response.status === 404) {
          // User doesn't have a profile yet - silently ignore
          return;
        } else {
          console.error('Failed to fetch unread messages:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to check unread messages:', error);
      }
    };

    checkUnreadMessages();
    
    // Check every 30 seconds
    const interval = setInterval(checkUnreadMessages, 30000);
    
    // Also check when the page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkUnreadMessages();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoaded, user]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Helper function for debounced search
  const debouncedSearch = (newFilters: SearchFilters, page: number = 1) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchProfiles(newFilters, page);
    }, 300);
  };

  const checkConnectionStatus = useCallback(async (profileId: string) => {
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
  }, []);

  const fetchSpecializations = useCallback(async () => {
    try {
      const response = await fetch('/api/specializations');
      if (response.ok) {
        const data = await response.json();
        setSpecializationGroups(data);
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  }, []);

  const searchProfiles = useCallback(async (filtersToUse: SearchFilters, page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          // Handle boolean values properly
          if (typeof value === 'boolean') {
            params.append(key, value.toString());
          } else if (Array.isArray(value)) {
            // Handle arrays by appending each item
            value.forEach(item => {
              if (item) {
                params.append(key, item);
              }
            });
          } else {
            params.append(key, value.toString());
          }
        }
      });

      // Add pagination parameters
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      console.log('🔍 Search API Request URL:', `/api/search?${params}`);
      console.log('🔍 Search API Request params:', Object.fromEntries(params));
      
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      console.log('🔍 Search API Response:', data);
      setProfiles(data.profiles || []);
      
      // Update pagination info
      if (data.pagination) {
        console.log('🔍 Pagination data received:', data.pagination);
        setPagination(data.pagination);
      }
      
      // Check connection status for each profile (only for authenticated users)
      if (data.profiles && user) {
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
  }, [checkConnectionStatus, pagination.limit, user]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;
    fetchSpecializations();
    searchProfiles(filters, 1);
  }, [fetchSpecializations, filters, searchProfiles]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSpecialization = (specializationSlug: string) => {
    setFilters(prev => {
      const newSpecializations = prev.specialization.includes(specializationSlug)
        ? prev.specialization.filter(s => s !== specializationSlug)
        : [...prev.specialization, specializationSlug];
      
      const newFilters = { ...prev, specialization: newSpecializations };
      
      // Debounce the search
      debouncedSearch(newFilters, 1);
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    const clearedFilters = {
      q: '',
      credential_type: '',
      state: '',
      specialization: [],
      software: '',
      accepting_work: '',
      verified_only: false,
      years_experience: ''
    };
    setFilters(clearedFilters);
    
    // Debounce the search
    debouncedSearch(clearedFilters, 1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      searchProfiles(filters, page);
    }
  };

  const changePageSize = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit }));
    searchProfiles(filters, 1); // Reset to page 1 when changing page size
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
      
      {/* Selected Specializations */}
      {filters.specialization.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Selected:</p>
          <div className="flex flex-wrap gap-2">
            {filters.specialization.map(spec => (
              <span
                key={spec}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
              >
                {specializationGroups.flatMap(group => group.items).find(s => s.slug === spec)?.label || spec}
                <button
                  onClick={() => toggleSpecialization(spec)}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

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
                onClick={() => toggleSpecialization(specSlug)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  filters.specialization.includes(specSlug)
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
                      type="checkbox"
                      checked={filters.specialization.includes(spec.slug)}
                      onChange={() => toggleSpecialization(spec.slug)}
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

  // Show loading state only while profiles are loading (not waiting for auth)
  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading professionals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="container-mobile py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/search" className="hover:text-slate-900 font-medium text-slate-900">Directory</Link>
            
            {/* Community Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                onBlur={() => setTimeout(() => setIsCommunityOpen(false), 200)}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors"
              >
                Community
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isCommunityOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <Link href="/jobs" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                    Jobs
                  </Link>
                  <Link href="/events" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                    Events
                  </Link>
                  <Link href="/mentorship" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                    Mentorship
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="/partners" className="hover:text-slate-900 flex items-center gap-1.5">
              <span className="text-base">🤝</span>
              Partners
            </Link>
            
            <Link href="/ai" className="hover:text-slate-900">AI</Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Feedback Icon */}
                <Link
                  href="/feedback"
                  className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
                  aria-label="Log an improvement or issue"
                  title="Log an improvement or issue"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </Link>

                {/* Messages Icon */}
                <Link
                  href="/messages"
                  className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
                  aria-label="Messages"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {/* Unread message indicator */}
                  {hasUnreadMessages && (
                    <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </div>
                  )}
                </Link>
                
                <UserMenu 
                  userName={user.fullName || undefined}
                  userEmail={user.primaryEmailAddress?.emailAddress}
                />
              </>
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
              onClick={() => {
                console.log('Mobile menu button clicked');
                setIsMobileNavOpen(true);
              }}
              className="mobile-menu-btn"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="container-mobile py-8">
        {/* Simple, user-focused header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Find Verified Tax Professionals
          </h1>
          <div className="mb-4 max-w-3xl">
            <p className="text-slate-600 text-base mb-3">
              Browse <strong>200+ verified CPAs, Enrolled Agents, and CTEC tax preparers</strong> for overflow staffing, second reviews, IRS representation, and specialized tax work. Every professional on TaxProExchange is manually verified—credentials confirmed directly with state boards and the IRS.
            </p>
            <p className="text-slate-600 text-base">
              Filter by credential type, state, specialization (S-Corp, multi-state SALT, cryptocurrency, trusts & estates, partnership K-1), years of experience, and software proficiency. Whether you need help with peak season overflow, complex returns, or Circular 230 representation, find qualified professionals ready to collaborate.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {filters.verified_only 
              ? `✓ Showing ${pagination.total || '200+'} verified professionals`
              : "Showing all profiles. Unverified profiles are visible but cannot be viewed until verification is complete."
            }
          </p>
        </div>

        {/* Mobile Filters - Top */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Quick Filters</h2>
            
            {/* Mobile Search */}
            <div>
              <input
                type="text"
                placeholder="Search professionals..."
                value={filters.q}
                onChange={(e) => {
                  const searchValue = e.target.value;
                  const newFilters = { ...filters, q: searchValue };
                  
                  // Only auto-detect state codes if the search is exactly 2 characters and matches a state
                  const stateCode = states.find(state => state.toLowerCase() === searchValue.toLowerCase().trim());
                  if (stateCode && searchValue.trim().length === 2 && searchValue.trim().length === searchValue.length) {
                    // If it's exactly a 2-letter state code, set the location filter and clear the search query
                    newFilters.state = stateCode;
                    newFilters.q = '';
                  } else {
                    // Clear state filter if user is typing a name or other search term
                    if (filters.state && searchValue.length > 0) {
                      newFilters.state = '';
                    }
                  }
                  
                  setFilters(newFilters);
                  
                  // Only search if there's actual content or if the search is being cleared
                  if (searchValue.trim().length > 0 || newFilters.q === '') {
                    debouncedSearch(newFilters, 1);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Mobile Filter Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Credential Type */}
              <select
                value={filters.credential_type}
                onChange={(e) => {
                  const newFilters = { ...filters, credential_type: e.target.value };
                  setFilters(newFilters);
                  debouncedSearch(newFilters, 1);
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All credentials</option>
                <option value="CPA">CPA</option>
                <option value="EA">EA</option>
                <option value="CTEC">CTEC</option>
                <option value="Student">Student</option>
                <option value="Other">Other</option>
              </select>

              {/* Location */}
              <select
                value={filters.state}
                onChange={(e) => {
                  const newFilters = { ...filters, state: e.target.value };
                  setFilters(newFilters);
                  debouncedSearch(newFilters, 1);
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All locations</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Mobile Verified Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Verified Only</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.verified_only}
                  onChange={(e) => {
                    const newFilters = { ...filters, verified_only: e.target.checked };
                    setFilters(newFilters);
                    debouncedSearch(newFilters, 1);
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
                
                {/* Verified Only Switch - Prominently placed at top */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-medium text-blue-900">Verified</span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.verified_only}
                        onChange={(e) => {
                          const newFilters = { ...filters, verified_only: e.target.checked };
                          setFilters(newFilters);
                          debouncedSearch(newFilters, 1);
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
                      const searchValue = e.target.value;
                      const newFilters = { ...filters, q: searchValue };
                      
                      // Only auto-detect state codes if the search is exactly 2 characters and matches a state
                      const stateCode = states.find(state => state.toLowerCase() === searchValue.toLowerCase().trim());
                      if (stateCode && searchValue.trim().length === 2 && searchValue.trim().length === searchValue.length) {
                        // If it's exactly a 2-letter state code, set the location filter and clear the search query
                        newFilters.state = stateCode;
                        newFilters.q = '';
                      } else {
                        // Clear state filter if user is typing a name or other search term
                        if (filters.state && searchValue.length > 0) {
                          newFilters.state = '';
                        }
                      }
                      
                      setFilters(newFilters);
                      
                      // Only search if there's actual content or if the search is being cleared
                      if (searchValue.trim().length > 0 || newFilters.q === '') {
                        debouncedSearch(newFilters, 1);
                      }
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
                       debouncedSearch(newFilters, 1);
                     }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All credentials</option>
                    <option value="CPA">CPA</option>
                    <option value="EA">EA</option>
                    <option value="CTEC">CTEC</option>
                    <option value="Student">Student</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                  <select
                    value={filters.state}
                    onChange={(e) => {
                      const newFilters = { ...filters, state: e.target.value };
                      setFilters(newFilters);
                      debouncedSearch(newFilters, 1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All locations</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
                  <select
                    value={filters.years_experience}
                    onChange={(e) => {
                      const newFilters = { ...filters, years_experience: e.target.value };
                      setFilters(newFilters);
                      debouncedSearch(newFilters, 1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {yearsExperienceOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Software */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Software</label>
                  <select
                    value={filters.software}
                    onChange={(e) => {
                      const newFilters = { ...filters, software: e.target.value };
                      setFilters(newFilters);
                      debouncedSearch(newFilters, 1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {softwareOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
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
                       debouncedSearch(newFilters, 1);
                     }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All profiles</option>
                    <option value="true">Accepting work</option>
                  </select>
                </div>



                {/* Search Button */}
                                 <button
                   onClick={() => searchProfiles(filters, 1)}
                   className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                 >
                   Search
                 </button>

                {/* Clear All Filters */}
                {(filters.q || filters.credential_type || filters.state || filters.specialization.length > 0 || filters.software || filters.accepting_work || filters.verified_only || filters.years_experience) && (
                  <button
                                       onClick={() => {
                    const clearedFilters = {
                      q: '',
                      credential_type: '',
                      state: '',
                      specialization: [],
                      software: '',
                      accepting_work: '',
                      verified_only: true,
                      years_experience: ''
                    };
                     setFilters(clearedFilters);
                     debouncedSearch(clearedFilters, 1);
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
          <div className="lg:col-span-3">
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
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            {profile.profile_type === 'firm_admin' && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-2 border-yellow-500 shadow-md flex-shrink-0" title="Premium Firm Member">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </span>
                            )}
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
                          {safeMap(profile.specializations, (spec, index) => {
                            // Skip null, undefined, or empty specializations
                            if (!spec || spec.trim() === '') return null;
                            
                            const specLabel = specializationGroups.flatMap(group => group.items).find(s => s.slug === spec)?.label || spec;
                            return (
                              <span
                                key={`${profile.id}-spec-${index}-${spec}`}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                              >
                                {specLabel}
                              </span>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {(() => {
                            const location = getLocationDisplay(profile);
                            return (
                              <span className="flex items-center gap-1">
                                <span>{location.flag}</span>
                                <span>{location.text}</span>
                              </span>
                            );
                          })()}
                          {profile.years_experience && (
                            <span>Experience: {profile.years_experience === '31+' ? '31+ years' : `${profile.years_experience} years`}</span>
                          )}
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
                            {profile.first_name} {profile.last_name}, {profile.credential_type}
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
                          user ? (
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
                          ) : (
                            <a
                              href="/join"
                              className="inline-flex items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 text-sm font-medium transition-colors"
                            >
                              Sign in to Connect
                            </a>
                          )
                        )}
                        

                        
                        {/* Show Message button for connected users */}
                        {profile.accepting_work && connectionStates[profile.id]?.status === 'accepted' && user && (
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

            {/* Pagination Controls */}
            {(() => {
              console.log('🔍 Pagination check - loading:', loading, 'profiles length:', profiles?.length, 'totalPages:', pagination.totalPages, 'total:', pagination.total);
              return !loading && profiles && profiles.length > 0;
            })() && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results info */}
                <div className="text-sm text-slate-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  {pagination.totalPages <= 1 && <span className="ml-2 text-blue-600">(Single page)</span>}
                </div>

                {/* Page size selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Show:</label>
                  <select
                    value={pagination.limit}
                    onChange={(e) => changePageSize(parseInt(e.target.value))}
                    className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-slate-600">per page</span>
                </div>

                {/* Pagination buttons - only show if multiple pages */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-1 text-sm border rounded ${
                              pageNum === pagination.page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <AppMobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </div>
  );
}
