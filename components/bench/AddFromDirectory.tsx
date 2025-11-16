/**
 * AddFromDirectory Component
 * 
 * Modal to search directory and add professionals to firm bench.
 * Uses existing /api/search endpoint.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  credential_type: string;
  slug: string;
  firm_name?: string;
  avatar_url?: string;
  image_url?: string;
  headline?: string;
  bio?: string;
  primary_location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  specializations?: string[];
  software?: string[];
  years_experience?: string;
  accepting_work?: boolean;
  visibility_state?: string;
}

interface AddFromDirectoryProps {
  firmId: string;
  onAdd: (profileId: string) => Promise<void>;
  onClose: () => void;
}

// Helper to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? 
      <mark key={i} className="bg-yellow-200 font-semibold">{part}</mark> : 
      part
  );
}

// Helper to get match reason (why this profile matched)
function getMatchReason(profile: Profile, query: string): string | null {
  if (!query) return null;
  
  const q = query.toLowerCase();
  
  // Check different fields
  if (profile.bio?.toLowerCase().includes(q)) {
    const start = profile.bio.toLowerCase().indexOf(q);
    const excerpt = profile.bio.substring(Math.max(0, start - 30), Math.min(profile.bio.length, start + 100));
    return `...${excerpt}...`;
  }
  
  if (profile.specializations?.some(s => s.toLowerCase().includes(q))) {
    const match = profile.specializations.find(s => s.toLowerCase().includes(q));
    return `Specializes in: ${match}`;
  }
  
  if (profile.software?.some(s => s.toLowerCase().includes(q))) {
    const match = profile.software.find(s => s.toLowerCase().includes(q));
    return `Uses: ${match}`;
  }
  
  return null;
}

export default function AddFromDirectory({ firmId, onAdd, onClose }: AddFromDirectoryProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [invitingProfileId, setInvitingProfileId] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteTitle, setInviteTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Filters
  const [credentialType, setCredentialType] = useState('');
  const [state, setState] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [software, setSoftware] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [acceptingWork, setAcceptingWork] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [multistate, setMultistate] = useState(false);
  const [international, setInternational] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Search effect - triggers when query or filters change
  useEffect(() => {
    // Allow search with just filters, no query required
    const searchProfiles = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          limit: '50',
        });
        
        if (debouncedQuery) params.set('q', debouncedQuery);
        if (credentialType) params.set('credential_type', credentialType);
        if (state) params.set('state', state);
        if (specialization) params.set('specialization', specialization);
        if (software) params.set('software', software);
        if (yearsExperience) params.set('years_experience', yearsExperience);
        if (acceptingWork) params.set('accepting_work', 'true');
        if (verifiedOnly) params.set('verified_only', 'true');
        if (multistate) params.set('works_multistate', 'true');
        if (international) params.set('works_international', 'true');

        const response = await fetch(`/api/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.profiles || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    searchProfiles();
  }, [debouncedQuery, credentialType, state, specialization, software, yearsExperience, acceptingWork, verifiedOnly, multistate, international]);

  const handleInviteClick = (profileId: string) => {
    setInvitingProfileId(profileId);
    setInviteMessage('');
    setInviteTitle('');
  };

  const handleSendInvite = async () => {
    if (!invitingProfileId) return;

    setAddingId(invitingProfileId);
    try {
      const response = await fetch('/api/firm-team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_id: firmId,
          profile_id: invitingProfileId,
          message: inviteMessage || undefined,
          custom_title_offer: inviteTitle || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      // Mark as invited
      setAddedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(invitingProfileId);
        return newSet;
      });
      setInvitingProfileId(null);
      
      // Show success message
      setSuccessMessage('Invitation sent! The professional will be notified by email and can accept or decline.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      setErrorMessage(error.message || 'Failed to send invitation');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add from Directory
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {results.length} professional{results.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success Message Toast */}
          {successMessage && (
            <div className="mx-4 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800 flex-1">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Error Message Toast */}
          {errorMessage && (
            <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800 flex-1">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, firm, credential, or specialization..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Credential Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credential Type
                    </label>
                    <select
                      value={credentialType}
                      onChange={(e) => setCredentialType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Credentials</option>
                      <option value="CPA">CPA</option>
                      <option value="EA">EA</option>
                      <option value="CTEC">CTEC</option>
                      <option value="Attorney">Attorney</option>
                      <option value="CFP">CFP</option>
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State License
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All States</option>
                      <option value="CA">California</option>
                      <option value="NY">New York</option>
                      <option value="TX">Texas</option>
                      <option value="FL">Florida</option>
                      <option value="IL">Illinois</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="OH">Ohio</option>
                      <option value="GA">Georgia</option>
                      <option value="NC">North Carolina</option>
                      <option value="MI">Michigan</option>
                    </select>
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Specialization
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Specializations</option>
                      <optgroup label="Individual & Family">
                        <option value="Individual Tax (1040)">Individual Tax (1040)</option>
                        <option value="High Net Worth">High Net Worth (UHNWI)</option>
                        <option value="Trusts & Estates">Trusts & Estates (1041, 706, 709)</option>
                        <option value="Gift Tax">Gift Tax Planning</option>
                      </optgroup>
                      <optgroup label="Business Entities">
                        <option value="S-Corporation (1120-S)">S-Corporation (1120-S)</option>
                        <option value="C-Corporation (1120)">C-Corporation (1120)</option>
                        <option value="Partnership (1065)">Partnership (1065)</option>
                        <option value="LLC Tax Planning">LLC Tax Planning</option>
                        <option value="Multi-Member LLC">Multi-Member LLC</option>
                      </optgroup>
                      <optgroup label="Specialized Areas">
                        <option value="Multi-State & SALT">Multi-State & SALT</option>
                        <option value="IRS Exams & Audits">IRS Exams & Audits</option>
                        <option value="IRS Collections">IRS Collections & Settlements</option>
                        <option value="Tax Court">Tax Court Representation</option>
                        <option value="Cryptocurrency">Cryptocurrency & Digital Assets</option>
                        <option value="International Tax">International Tax (FBAR, FATCA)</option>
                        <option value="Expatriate Tax">Expatriate & Foreign National</option>
                        <option value="R&D Credits">R&D Tax Credits</option>
                        <option value="Cost Segregation">Cost Segregation</option>
                      </optgroup>
                      <optgroup label="Industries">
                        <option value="Real Estate">Real Estate Professionals</option>
                        <option value="Construction">Construction & Contractors</option>
                        <option value="Healthcare">Healthcare & Medical</option>
                        <option value="Restaurants">Restaurants & Hospitality</option>
                        <option value="E-Commerce">E-Commerce & Online Business</option>
                        <option value="Cannabis">Cannabis Industry</option>
                        <option value="Nonprofit">Nonprofit (990)</option>
                        <option value="Agriculture">Agriculture & Farming</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="Bookkeeping">Bookkeeping & Cleanup</option>
                        <option value="Payroll">Payroll Services</option>
                        <option value="Sales Tax">Sales Tax & Use Tax</option>
                        <option value="Tax Planning">Strategic Tax Planning</option>
                        <option value="CFO Services">Fractional CFO Services</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Software */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Software
                    </label>
                    <select
                      value={software}
                      onChange={(e) => setSoftware(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Any Software</option>
                      <optgroup label="Professional Software">
                        <option value="ProSeries">Thomson Reuters ProSeries</option>
                        <option value="Lacerte">Intuit Lacerte</option>
                        <option value="Drake">Drake Tax</option>
                        <option value="UltraTax CS">UltraTax CS</option>
                        <option value="CCH Axcess">CCH Axcess Tax</option>
                        <option value="CCH ProSystem fx">CCH ProSystem fx</option>
                        <option value="GoSystem Tax RS">GoSystem Tax RS</option>
                      </optgroup>
                      <optgroup label="Small Firm / Consumer">
                        <option value="TurboTax">TurboTax</option>
                        <option value="TaxAct">TaxAct</option>
                        <option value="H&R Block">H&R Block</option>
                        <option value="TaxSlayer">TaxSlayer Pro</option>
                      </optgroup>
                      <optgroup label="Other Tools">
                        <option value="QuickBooks">QuickBooks</option>
                        <option value="Xero">Xero</option>
                        <option value="Sage">Sage</option>
                        <option value="FreshBooks">FreshBooks</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Years Experience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience
                    </label>
                    <select
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Any Experience</option>
                      <option value="0-2">0-2 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="6-10">6-10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptingWork}
                      onChange={(e) => setAcceptingWork(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Accepting work now</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Verified only</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={multistate}
                      onChange={(e) => setMultistate(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Works multi-state</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={international}
                      onChange={(e) => setInternational(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">International tax</span>
                  </label>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setCredentialType('');
                    setState('');
                    setSpecialization('');
                    setSoftware('');
                    setYearsExperience('');
                    setAcceptingWork(false);
                    setVerifiedOnly(true);
                    setMultistate(false);
                    setInternational(false);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="p-4 flex-1 overflow-y-auto">
            {isSearching && (
              <div className="text-center text-gray-500 py-8">
                <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            )}

            {!isSearching && results.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">No professionals found</p>
                <p className="text-sm text-gray-600">Try adjusting your search criteria or filters</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((profile) => {
                  const avatarUrl = profile.image_url || profile.avatar_url;
                  const isAdding = addingId === profile.id;
                  const isAdded = addedIds.has(profile.id);
                  const location = profile.primary_location;
                  const locationStr = location ? 
                    [location.city, location.state].filter(Boolean).join(', ') : null;
                  const matchReason = getMatchReason(profile, debouncedQuery);
                  const isVerified = profile.visibility_state === 'verified';

                  return (
                    <div
                      key={profile.id}
                      className="flex gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={`${profile.first_name} ${profile.last_name}`}
                            className="w-14 h-14 rounded-full object-cover"
                            width={56}
                            height={56}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                            {profile.first_name[0]}{profile.last_name[0]}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Name and Credential with Verification */}
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">
                            {profile.first_name} {profile.last_name}, {profile.credential_type}
                          </p>
                          {isVerified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✓ Verified
                            </span>
                          )}
                          {profile.accepting_work && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Available
                            </span>
                          )}
                        </div>

                        {/* Location and Experience */}
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                          {locationStr && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {locationStr}
                            </span>
                          )}
                          {profile.years_experience && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {profile.years_experience} years
                            </span>
                          )}
                        </div>

                        {/* Firm Name */}
                        {profile.firm_name && (
                          <p className="text-sm text-gray-600 mb-1">{profile.firm_name}</p>
                        )}

                        {/* Headline */}
                        {profile.headline && (
                          <p className="text-sm text-gray-700 mb-2">
                            {highlightMatch(profile.headline, debouncedQuery)}
                          </p>
                        )}

                        {/* Specializations */}
                        {profile.specializations && profile.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {profile.specializations.slice(0, 3).map((spec, idx) => (
                              <span key={idx} className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {highlightMatch(spec, debouncedQuery)}
                              </span>
                            ))}
                            {profile.specializations.length > 3 && (
                              <span className="inline-block text-xs text-gray-500 px-2 py-0.5">
                                +{profile.specializations.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Match Reason */}
                        {matchReason && (
                          <div className="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded">
                            <p className="text-xs text-gray-700">
                              <span className="font-semibold">Match: </span>
                              {highlightMatch(matchReason, debouncedQuery)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Invite Button */}
                      <div className="flex-shrink-0">
                        {isAdded ? (
                          <div className="px-4 py-2 text-sm font-medium text-green-600 border border-green-600 bg-green-50 rounded-lg whitespace-nowrap">
                            ✓ Invited
                          </div>
                        ) : (
                          <button
                            onClick={() => handleInviteClick(profile.id)}
                            disabled={isAdding}
                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            Invite
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invitation Dialog */}
        {invitingProfileId && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 1 }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Send Team Invitation
              </h3>
              
              <div className="space-y-4">
                {/* Custom Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suggested Role/Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={inviteTitle}
                    onChange={(e) => setInviteTitle(e.target.value)}
                    placeholder="e.g., IRS Representation Specialist, S-Corp Reviewer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Tell them about your firm, the type of work, or why you&rsquo;d like them on your team..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    They&rsquo;ll receive an email with your invitation and can accept or decline.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSendInvite}
                    disabled={!!addingId}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingId ? 'Sending...' : 'Send Invitation'}
                  </button>
                  <button
                    onClick={() => setInvitingProfileId(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

