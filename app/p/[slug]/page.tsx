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
  avatar_url: string | null;
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
                <span>
                  States: {profile.states && profile.states.length > 0 ? (
                    `${profile.states.length} state${profile.states.length !== 1 ? 's' : ''}`
                  ) : 'Not specified'}
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
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-slate-600">Credential verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-slate-600">Background checked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm text-slate-600">Professional verified</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </div>
  );
}
