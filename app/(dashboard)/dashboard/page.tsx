import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getCurrentProfile, getVerificationRequest, isOnboardingComplete } from '@/lib/db/profile';
import { getRecentConnections, getRecentlyVerified, getRecentMessages } from '@/lib/db/activity';
import ProfileStatusCard from '@/components/dashboard/ProfileStatusCard';
import VerificationCard from '@/components/dashboard/VerificationCard';
import QuickActions from '@/components/dashboard/QuickActions';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { DashboardDebug } from '@/components/debug/DashboardDebug';
import Link from 'next/link';

export default async function DashboardPage() {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user data
  const [profile, verificationRequest, connections, recentlyVerified, recentMessages] = await Promise.all([
    getCurrentProfile(),
    getCurrentProfile().then(profile => 
      profile ? getVerificationRequest(profile.id) : null
    ),
    getCurrentProfile().then(profile => 
      profile ? getRecentConnections(profile.id) : []
    ),
    getRecentlyVerified(),
    getCurrentProfile().then(profile => 
      profile ? getRecentMessages(profile.id) : []
    )
  ]);

  const onboardingComplete = isOnboardingComplete(profile);
  
  // Debug logging - v2
  console.log('🔍 Dashboard Debug v2:', {
    userId,
    profile: profile ? {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      onboarding_complete: profile.onboarding_complete,
      clerk_id: profile.clerk_id,
      clerk_user_id: profile.clerk_user_id
    } : null,
    onboardingComplete
  });

  // Client-side debug logging
  if (typeof window !== 'undefined') {
    console.log('🔍 Client-side Dashboard Debug:', {
      userId,
      profile: profile ? {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        onboarding_complete: profile.onboarding_complete,
        clerk_id: profile.clerk_id,
        clerk_user_id: profile.clerk_user_id
      } : null,
      onboardingComplete
    });
  }
  const canPostJobs = profile?.visibility_state === 'verified' && Boolean(profile?.firm_name);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <DashboardDebug 
        userId={userId} 
        profile={profile} 
        onboardingComplete={onboardingComplete} 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's what's happening with your profile and connections.
          </p>
        </div>

        {/* Onboarding Checklist - Show if incomplete */}
        {!onboardingComplete && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Complete your profile to get started
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Finish setting up your profile to start connecting with other tax professionals and access all features.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        profile?.first_name && profile?.last_name && profile?.credential_type 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {profile?.first_name && profile?.last_name && profile?.credential_type ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">Basic information (name, credential type)</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        profile?.phone || profile?.public_email 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {profile?.phone || profile?.public_email ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">Contact information (phone or email)</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        profile?.bio && profile.bio.length > 10 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {profile?.bio && profile.bio.length > 10 ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">Professional bio and specializations</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Complete Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column - Profile Status and Verification */}
          <div className="lg:col-span-6 space-y-6">
            <ProfileStatusCard 
              profile={profile} 
              verificationRequest={verificationRequest} 
            />
            <VerificationCard 
              verificationRequest={verificationRequest} 
              isOnboardingComplete={onboardingComplete}
              visibilityState={profile?.visibility_state}
            />
          </div>

          {/* Right column - Quick Actions and Activity */}
          <div className="lg:col-span-6 space-y-6">
            <QuickActions canPostJobs={canPostJobs} />
            <ActivityFeed 
              connections={connections} 
              recentlyVerified={recentlyVerified}
              recentMessages={recentMessages}
              currentProfileId={profile?.id || ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
