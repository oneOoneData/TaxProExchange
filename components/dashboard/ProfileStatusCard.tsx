import Link from 'next/link';
import { Profile, VerificationRequest, getProfileDisplayName, getCredentialBadgeColor, getVisibilityBadgeColor, getPublicProfileUrl, isFirmMember, getFirmMemberBadgeColor } from '@/lib/db/profile';

interface ProfileStatusCardProps {
  profile: Profile | null;
  verificationRequest: VerificationRequest | null;
}

export default function ProfileStatusCard({ profile, verificationRequest }: ProfileStatusCardProps) {
  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = getProfileDisplayName(profile);
  const publicUrl = getPublicProfileUrl(profile.slug);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            {isFirmMember(profile) && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-2 border-yellow-500 shadow-md flex-shrink-0" title="Premium Firm Member">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            )}
            {displayName}
          </h2>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCredentialBadgeColor(profile.credential_type)}`}>
              {profile.credential_type}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVisibilityBadgeColor(profile.visibility_state)}`}>
              {profile.visibility_state === 'verified' ? 'Verified' : 
               profile.visibility_state === 'pending_verification' ? 'Pending verification' : 
               profile.visibility_state === 'rejected' ? 'Rejected' : 'Hidden'}
            </span>
          </div>
        </div>
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Work availability:</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            profile.accepting_work ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {profile.accepting_work ? 'Accepting work' : 'Not accepting work'}
          </span>
        </div>

        {profile.firm_name && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Firm:</span>
            <span className="text-sm font-medium text-gray-900">{profile.firm_name}</span>
          </div>
        )}

        {profile.headline && (
          <div className="text-sm text-gray-600">
            {profile.headline}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href="/profile/edit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
        >
          Edit Profile
        </Link>
        {profile.slug && (
          <Link
            href={publicUrl}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
          >
            View Public Profile
          </Link>
        )}
      </div>

      {!profile.slug && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Complete your profile to get a public listing and start connecting with other tax professionals.
          </p>
        </div>
      )}
    </div>
  );
}
