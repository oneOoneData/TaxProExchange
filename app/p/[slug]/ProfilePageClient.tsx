'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useUser } from '@clerk/nextjs';
import { safeMap, safeLength } from '@/lib/safe';
import { getCountryName } from '@/lib/constants/countries';
import MobileNav from '@/components/MobileNav';
import ProfileJsonLd from '@/components/ProfileJsonLd';

interface License {
  id: string;
  license_kind: string;
  license_number: string;
  issuing_authority: string;
  state?: string;
  expires_on?: string;
  board_profile_url?: string;
  status: string;
}

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
  phone: string;
  website_url: string;
  linkedin_url: string;
  accepting_work: boolean;
  verified: boolean;
  public_contact: boolean;
  works_multistate: boolean;
  works_international: boolean;
  countries: string[];
  specializations: string[];
  states: string[];
  software: string[];
  other_software: string[];
  opportunities: string;
  licenses?: License[];
  avatar_url: string | null;
  years_experience?: string;
  entity_revenue_range?: string;
  primary_location?: {
    country: string;
    state: string | null;
    city: string | null;
    display_name: string | null;
  };
  visibility_state: 'hidden' | 'pending_verification' | 'verified' | 'rejected';
  is_listed?: boolean;
  created_at?: string;
  profile_locations?: any[];
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

interface ProfilePageClientProps {
  profile: Profile;
}

export default function ProfilePageClient({ profile }: ProfilePageClientProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [specializationGroups, setSpecializationGroups] = useState<SpecializationGroup[]>([]);
  const [isAdminView, setIsAdminView] = useState(false);
  const [connectionState, setConnectionState] = useState<{ status: string; connectionId?: string; isRequester?: boolean } | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Helper function to format date as MM/YYYY
  const formatMMYYYY = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' });
  };

  // Handle verification actions
  const handleVerification = async (action: 'approve' | 'reject') => {
    if (!profile || !isAdminView) return;
    
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/admin/verifications/${profile.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh the profile data to show updated status
        window.location.reload();
      } else {
        console.error('Verification failed:', response.statusText);
        alert('Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    // Check if this is an admin view
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    const isAdmin = adminParam === 'true';
    setIsAdminView(isAdmin);
    
    fetchSpecializations();
    
    // Check connection status if user is signed in
    if (isSignedIn && user) {
      checkConnectionStatus(profile.id);
    }
  }, [profile.id, isSignedIn, user]);

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

  // Determine if contact info should be shown
  const shouldShowContactInfo = () => {
    if (!profile) return false;
    return isSignedIn || profile.public_contact;
  };

  const checkConnectionStatus = async (profileId: string) => {
    try {
      const response = await fetch(`/api/connections/status?otherProfileId=${profileId}`);
      if (response.ok) {
        const data = await response.json();
        setConnectionState(data);
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const handleConnect = async (profileId: string) => {
    try {
      const response = await fetch('/api/connections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientProfileId: profileId })
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionState({ status: 'pending', connectionId: data.connection.id, isRequester: true });
      } else {
        const error = await response.json();
        if (error.error === 'Connection already exists') {
          setConnectionState({ 
            status: error.connection.status, 
            connectionId: error.connection.id,
            isRequester: error.connection.requester_profile_id === profileId
          });
        } else {
          console.error('Connection failed:', error);
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
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
        // Refresh connection status
        if (profile) {
          checkConnectionStatus(profile.id);
        }
      } else {
        console.error('Failed to accept connection');
      }
    } catch (error) {
      console.error('Accept connection error:', error);
    }
  };

  // Create a mapping from display labels to database slugs
  const createLabelToSlugMap = () => {
    const labelToSlugMap: { [key: string]: string } = {};
    specializationGroups.forEach(group => {
      group.items.forEach(item => {
        labelToSlugMap[item.label] = item.slug;
      });
    });
    return labelToSlugMap;
  };

  // Group profile specializations by their groups
  const getGroupedProfileSpecializations = () => {
    if (!profile || !specializationGroups.length) {
      return [];
    }
    
    // Create mapping from labels to slugs
    const labelToSlugMap = createLabelToSlugMap();
    
    // Convert profile specializations from labels to slugs
    const profileSlugs = profile.specializations.map(label => labelToSlugMap[label]).filter(Boolean);
    
    const grouped = specializationGroups.map(group => ({
      ...group,
      items: group.items.filter(spec => profileSlugs.includes(spec.slug))
    })).filter(group => group.items.length > 0);
    
    return grouped;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/search" className="hover:text-slate-900">Search</Link>
            {isAdminView && (
              <>
                <Link href="/admin" className="hover:text-slate-900">Admin</Link>
                <Link href="/admin/profiles" className="hover:text-slate-900">Profiles</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-4">
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

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Banner */}
        {isAdminView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Admin View Mode</h3>
                  <p className="text-sm text-blue-700">You are viewing this profile as an administrator</p>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Verification buttons for pending profiles */}
                {profile.visibility_state === 'pending_verification' && (
                  <>
                    <button
                      onClick={() => handleVerification('approve')}
                      disabled={isVerifying}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {isVerifying ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection (optional):');
                        if (reason !== null) {
                          handleVerification('reject');
                        }
                      }}
                      disabled={isVerifying}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isVerifying ? 'Processing...' : '✗ Reject'}
                    </button>
                  </>
                )}
                
                <Link
                  href={`/admin/profiles/${profile.id}/edit`}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/admin/profiles"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Back to Profiles
                </Link>
              </div>
            </div>
            
            {/* Admin Information Panel */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Profile ID:</span>
                  <p className="text-blue-800 font-mono text-xs">{profile.id}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Status:</span>
                  <p className={`font-medium ${
                    profile.visibility_state === 'verified' ? 'text-emerald-600' :
                    profile.visibility_state === 'pending_verification' ? 'text-amber-600' :
                    profile.visibility_state === 'rejected' ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {profile.visibility_state.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Listed:</span>
                  <p className={`font-medium ${profile.is_listed ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {profile.is_listed ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Created:</span>
                  <p className="text-blue-800">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-xl sm:text-2xl font-semibold text-slate-600">
                {profile.first_name[0]}{profile.last_name[0]}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                  {profile.first_name} {profile.last_name}, {profile.credential_type}
                </h1>
                {profile.verified && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-emerald-100 text-emerald-700">
                    ✓ Verified
                  </span>
                )}
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-slate-100 text-slate-700">
                  {profile.credential_type}
                </span>
                {profile.works_multistate && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-700">
                    Multi-State
                  </span>
                )}
                {profile.works_international && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-700">
                    International
                  </span>
                )}
              </div>

              <p className="text-lg sm:text-xl text-slate-600 font-medium mb-2">{profile.headline}</p>
              
              {profile.firm_name && (
                <p className="text-slate-500 mb-3">{profile.firm_name}</p>
              )}

              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 mb-6">
                {/* Primary Location */}
                {profile.primary_location && (
                  <span>
                    📍 {profile.primary_location.city && profile.primary_location.state ? (
                      `${profile.primary_location.city}, ${profile.primary_location.state}`
                    ) : profile.primary_location.state ? (
                      profile.primary_location.state
                    ) : profile.primary_location.city ? (
                      profile.primary_location.city
                    ) : (
                      getCountryName(profile.primary_location.country)
                    )}
                  </span>
                )}
                <span>
                  {profile.works_multistate ? (
                    profile.states && profile.states.length > 0 ? (
                      `Multi-state (${profile.states.length} state${profile.states.length !== 1 ? 's' : ''})`
                    ) : (
                      'Multi-state'
                    )
                  ) : (
                    profile.states && profile.states.length > 0 ? (
                      `${profile.states.length} state${profile.states.length !== 1 ? 's' : ''}`
                    ) : 'Not specified'
                  )}
                </span>
                <span className={profile.accepting_work ? 'text-emerald-600' : 'text-slate-400'}>
                  {profile.accepting_work ? 'Accepting work' : 'Not accepting work'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                {profile.accepting_work && isSignedIn && (
                  <>
                    {/* Connect/Accept Button */}
                    {connectionState?.status === 'pending' && connectionState?.isRequester ? (
                      <button 
                        disabled
                        className="inline-flex items-center justify-center rounded-xl bg-yellow-100 text-yellow-700 border-yellow-200 px-4 sm:px-6 py-3 text-sm font-medium cursor-default"
                      >
                        Request Sent
                      </button>
                    ) : connectionState?.status === 'pending' && !connectionState?.isRequester ? (
                      <button 
                        onClick={() => handleAcceptConnection(connectionState.connectionId!)}
                        className="inline-flex items-center justify-center rounded-xl bg-green-600 text-white px-4 sm:px-6 py-3 text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Accept Request
                      </button>
                    ) : connectionState?.status === 'accepted' ? (
                      <button 
                        disabled
                        className="inline-flex items-center justify-center rounded-xl bg-green-100 text-green-700 border-green-200 px-4 sm:px-6 py-3 text-sm font-medium cursor-default"
                      >
                        Connected
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConnect(profile.id)}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 sm:px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                        Connect
                      </button>
                    )}

                    {/* Message Button for Connected Users */}
                    {connectionState?.status === 'accepted' && (
                      <Link
                        href={`/messages/${connectionState.connectionId}`}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-4 sm:px-6 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Message
                      </Link>
                    )}
                  </>
                )}
                
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 text-slate-700 px-4 sm:px-6 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Find Similar
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">About</h2>
              <p className="text-slate-600 leading-relaxed">{profile.bio}</p>
              {profile.opportunities && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Opportunities & Goals</h3>
                  <p className="text-slate-600 text-sm">{profile.opportunities}</p>
                </div>
              )}
            </motion.div>

            {/* Experience & Expertise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Experience & Expertise</h2>
              <div className="space-y-3">
                {profile.years_experience ? (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Years of Tax Experience</p>
                    <p className="text-slate-900 font-medium">
                      {profile.years_experience === '31+' ? '31+ years' : `${profile.years_experience} years`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Years of Tax Experience</p>
                    <p className="text-slate-400 italic">Not specified</p>
                  </div>
                )}
                {profile.entity_revenue_range ? (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Typical Entity Client Size</p>
                    <p className="text-slate-900 font-medium">{profile.entity_revenue_range}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Typical Entity Client Size</p>
                    <p className="text-slate-400 italic">Not specified</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Specializations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Specializations</h2>
              {getGroupedProfileSpecializations().length > 0 ? (
                <div className="space-y-4">
                  {getGroupedProfileSpecializations().map((group) => (
                    <div key={group.key} className="space-y-2">
                      <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                        {group.label}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((spec) => (
                          <span
                            key={spec.slug}
                            className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-blue-100 text-blue-700"
                          >
                            {spec.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">No specializations listed</p>
              )}
            </motion.div>

            {/* Software & Tools */}
            {((profile.software && profile.software.length > 0) || (profile.other_software && profile.other_software.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Software & Tools</h2>
                <div className="space-y-3">
                  {profile.software && profile.software.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-2">Standard Software</h3>
                      <div className="flex flex-wrap gap-2">
                        {safeMap(profile.software, softwareSlug => (
                          <span
                            key={softwareSlug}
                            className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-700"
                          >
                            {softwareSlug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.other_software && profile.other_software.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-2">Other Tools</h3>
                      <div className="flex flex-wrap gap-2">
                        {safeMap(profile.other_software, tool => (
                          <span
                            key={tool}
                            className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-700"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* International Countries */}
            {profile.works_international && profile.countries && profile.countries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">International Work</h2>
                <div className="flex flex-wrap gap-2">
                  {safeMap(profile.countries, countryCode => (
                    <span
                      key={countryCode}
                      className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-purple-100 text-purple-700"
                    >
                      {getCountryName(countryCode)}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6"
            >
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Contact</h3>
              {shouldShowContactInfo() ? (
                <div className="space-y-3">
                  {profile.public_email && (
                    <div className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <p className="text-sm text-slate-500 mb-1">Email</p>
                      <a
                        href={`mailto:${profile.public_email}`}
                        className="text-slate-900 hover:text-slate-700 break-all"
                      >
                        {profile.public_email}
                      </a>
                    </div>
                  )}
                  
                  {profile.phone && (
                    <div className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <p className="text-sm text-slate-500 mb-1">Phone</p>
                      <a
                        href={`tel:${profile.phone}`}
                        className="text-slate-900 hover:text-slate-700"
                      >
                        {profile.phone}
                      </a>
                    </div>
                  )}

                  {profile.website_url && (
                    <div className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <p className="text-sm text-slate-500 mb-1">Website</p>
                      <a
                        href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 hover:text-slate-700 break-all flex items-center gap-1"
                      >
                        {profile.website_url.replace(/^https?:\/\//, '')}
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {profile.linkedin_url && (
                    <div className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <p className="text-sm text-slate-500 mb-1">LinkedIn</p>
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 hover:text-slate-700 flex items-center gap-1"
                      >
                        View Profile
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-slate-400 mb-3">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium mb-2">Contact information is private</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Sign in to view contact details, or the profile owner can make their contact info public.
                  </p>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Sign In to View
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Verification Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6"
            >
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Verification</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {profile.visibility_state === 'verified' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm ${profile.visibility_state === 'verified' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Credential verified
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {profile.visibility_state === 'verified' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm ${profile.visibility_state === 'verified' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Background checked
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {profile.visibility_state === 'verified' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm ${profile.visibility_state === 'verified' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Professional verified
                  </span>
                </div>
              </div>
              
              {/* Status message for non-verified users */}
              {profile.visibility_state !== 'verified' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    {profile.visibility_state === 'pending_verification' 
                      ? 'Verification in progress - this profile is under review'
                      : profile.visibility_state === 'rejected'
                      ? 'Verification was rejected - this profile needs to be resubmitted'
                      : 'This profile has not been verified yet'
                    }
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </div>
  );
}
