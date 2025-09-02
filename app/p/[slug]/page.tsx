'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { safeMap, safeLength } from '@/lib/safe';
import { getCountryName } from '@/lib/constants/countries';
import MobileNav from '@/components/MobileNav';

export const dynamic = 'force-dynamic';

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
  licenses?: License[];
  avatar_url: string | null;
  primary_location?: {
    country: string;
    state: string | null;
    city: string | null;
    display_name: string | null;
  };
  visibility_state: 'hidden' | 'pending_verification' | 'verified' | 'rejected';
  is_listed?: boolean;
  created_at?: string;
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

export default function ProfilePage() {
  const params = useParams();
  const { user, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (params.slug) {
      // Check if this is an admin view
      const urlParams = new URLSearchParams(window.location.search);
      const adminParam = urlParams.get('admin');
      const isAdmin = adminParam === 'true';
      setIsAdminView(isAdmin);
      
      // Pass admin parameter directly to avoid race condition
      loadProfile(params.slug as string, isAdmin);
      fetchSpecializations();
    }
  }, [params.slug]);

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

  const loadProfile = async (slug: string, isAdmin: boolean = false) => {
    setLoading(true);
    try {
      // Pass admin parameter if this is an admin view
      const adminParam = isAdmin ? '?admin=true' : '';
      const response = await fetch(`/api/profile/${slug}${adminParam}`);
      if (response.ok) {
        const profileData = await response.json();
        console.log('Profile data loaded:', profileData);
        console.log('Admin view:', isAdmin);
        console.log('Licenses in profile data:', profileData.licenses);
        setProfile(profileData);
        
        // Check connection status if user is signed in
        if (isSignedIn && user) {
          checkConnectionStatus(profileData.id);
        }
      } else {
        console.error('Profile not found');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
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

  // Group profile specializations by their groups
  const getGroupedProfileSpecializations = () => {
    if (!profile || !specializationGroups.length) return [];
    
    return specializationGroups.map(group => ({
      ...group,
      items: group.items.filter(spec => profile.specializations.includes(spec.slug))
    })).filter(group => group.items.length > 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-slate-600 mb-4">The profile you're looking for doesn't exist.</p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Search for Professionals
          </Link>
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
          </motion.div>
        )}

        {/* Admin License Section */}
        {isAdminView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-6 sm:p-8 mb-8"
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Admin Only</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">License Information (Admin View)</h2>
              <p className="text-sm text-slate-600">Private license details for verification purposes - NOT visible to public users</p>
            </div>
            
            <div className="space-y-4">
              {profile.licenses && profile.licenses.length > 0 ? (
                profile.licenses.map((license, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-slate-900">License {index + 1}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      license.status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : license.status === 'pending_verification'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {license.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">License Number:</span>
                      <p className="text-slate-900 font-mono bg-slate-50 px-2 py-1 rounded mt-1">
                        {license.license_number}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">License Type:</span>
                      <p className="text-slate-900 mt-1">{license.license_kind}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Issuing Authority:</span>
                      <p className="text-slate-900 mt-1">{license.issuing_authority}</p>
                    </div>
                    {license.state && (
                      <div>
                        <span className="font-medium text-slate-700">State:</span>
                        <p className="text-slate-900 mt-1">{license.state}</p>
                      </div>
                    )}
                    {license.expires_on && (
                      <div>
                        <span className="font-medium text-slate-700">Expires:</span>
                        <p className="text-slate-900 mt-1">{formatMMYYYY(license.expires_on)}</p>
                      </div>
                    )}
                    {license.board_profile_url && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-slate-700">Board Profile:</span>
                        <a 
                          href={license.board_profile_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline ml-2"
                        >
                          View on Board
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-slate-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No Licenses Found</h3>
                  <p className="text-sm text-slate-600">
                    This profile doesn't have any license information yet.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Admin Verification Controls */}
        {isAdminView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 mb-8"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Profile Management</h2>
              <p className="text-sm text-slate-600">Admin controls for profile verification and listing</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-900">Verification Status</h3>
                    <p className="text-sm text-slate-600">Current: {profile.visibility_state}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    profile.visibility_state === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : profile.visibility_state === 'pending_verification'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.visibility_state}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-900">Listing Status</h3>
                    <p className="text-sm text-slate-600">Profile visibility</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    profile.is_listed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile.is_listed ? 'Listed' : 'Hidden'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleVerification('approve')}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isVerifying ? 'Processing...' : 'Approve & List Profile'}
                </button>
                
                <button
                  onClick={() => handleVerification('reject')}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {isVerifying ? 'Processing...' : 'Reject Profile'}
                </button>
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
                  {profile.first_name} {profile.last_name}
                </h1>
                {profile.verified && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-emerald-100 text-emerald-700">
                    ✓ Verified
                  </span>
                )}
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-slate-100 text-slate-700">
                  {profile.credential_type}
                </span>
                {/* License Information */}
                {profile.licenses && profile.licenses.length > 0 && profile.credential_type !== 'Student' && (
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
                    {profile.licenses
                      .filter(license => license.status === 'verified')
                      .map((license, index) => (
                        <span key={`${license.license_kind}-${license.state}-${index}`} className="flex items-center gap-1">
                          {index > 0 && <span>•</span>}
                          <span>
                            {license.license_kind === 'CPA_STATE_LICENSE' ? 'CPA' :
                             license.license_kind === 'EA_ENROLLMENT' ? 'EA' :
                             license.license_kind === 'CTEC_REG' ? 'CTEC' : 'Licensed'}
                            {license.state && ` (${license.state})`}
                          </span>
                          <span>•</span>
                          <span>Verified by {license.issuing_authority}</span>
                          {license.expires_on && (
                            <>
                              <span>•</span>
                              <span>Expires {formatMMYYYY(license.expires_on)}</span>
                            </>
                          )}
                          {license.board_profile_url && (
                            <>
                              <span>•</span>
                              <a 
                                href={license.board_profile_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="underline hover:text-slate-800"
                              >
                                View on board
                              </a>
                            </>
                          )}
                        </span>
                      ))}
                  </div>
                )}
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
            {profile.software && profile.software.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Software & Tools</h2>
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
                    <div>
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
                    <div>
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
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Website</p>
                      <a
                        href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 hover:text-slate-700 break-all"
                      >
                        {profile.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {profile.linkedin_url && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">LinkedIn</p>
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 hover:text-slate-700"
                      >
                        View Profile
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

            {/* Admin Information */}
            {isAdminView && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6 mb-6"
              >
                <h3 className="text-base sm:text-lg font-semibold text-amber-900 mb-4">Admin Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-amber-800">Profile ID:</span>
                    <span className="ml-2 text-amber-700 font-mono">{profile.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-amber-800">Visibility State:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      profile.visibility_state === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                      profile.visibility_state === 'pending_verification' ? 'bg-amber-100 text-amber-700' :
                      profile.visibility_state === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {profile.visibility_state}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-amber-800">Listed in Search:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      profile.is_listed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {profile.is_listed ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-amber-800">Created:</span>
                    <span className="ml-2 text-amber-700">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

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
