import Link from 'next/link';
import { Profile } from '@/lib/db/profile';
import Card from '@/components/ui/Card';

interface ProfileHealthProps {
  profile: Profile | null;
  score?: number;
  improvements?: string[];
}

export default function ProfileHealth({ profile, score, improvements = [] }: ProfileHealthProps) {
  if (!profile) {
    return (
      <Card title="Profile Health" description="Track your profile completeness">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  // Calculate profile health score
  const calculateScore = (): { score: number; improvements: string[] } => {
    let score = 0;
    const improvements: string[] = [];

    // Headline (20 points)
    if (profile.headline && profile.headline.length > 10) {
      score += 20;
    } else {
      improvements.push('Add professional headline (+20 points)');
    }

    // Bio (25 points)
    if (profile.bio && profile.bio.length >= 120) {
      score += 25;
    } else {
      improvements.push('Write detailed bio 120+ characters (+25 points)');
    }

    // Contact info (15 points)
    if (profile.phone || profile.public_email) {
      score += 15;
    } else {
      improvements.push('Add contact information (+15 points)');
    }

    // Firm info (10 points)
    if (profile.firm_name) {
      score += 10;
    } else {
      improvements.push('Add firm information (+10 points)');
    }

    // Specialties (15 points) - TODO: Get from profile_specializations
    // For now, assume incomplete
    improvements.push('Add specialties (+15 points)');

    // States (10 points) - TODO: Get from profile_locations
    // For now, assume incomplete
    improvements.push('Add service states (+10 points)');

    // Verification (20 points)
    if (profile.visibility_state === 'verified') {
      score += 20;
    } else {
      improvements.push('Verify your license (+20 points)');
    }

    // Recent activity (5 points) - TODO: Implement activity tracking
    // For now, give partial credit
    score += 3;
    improvements.push('Stay active on the platform (+2 points)');

    return { score, improvements };
  };

  const { score: calculatedScore, improvements: calculatedImprovements } = calculateScore();
  const finalScore = score ?? calculatedScore;
  const finalImprovements = improvements.length > 0 ? improvements : calculatedImprovements;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Poor';
  };

  return (
    <Card 
      title="Profile Health" 
      description="Boost your visibility and discoverability"
    >
      {/* Score Display */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBgColor(finalScore)} mb-2`}>
          <span className={`text-2xl font-bold ${getScoreColor(finalScore)}`}>
            {finalScore}
          </span>
        </div>
        <h4 className={`font-semibold ${getScoreColor(finalScore)}`}>
          {getScoreText(finalScore)}
        </h4>
        <p className="text-sm text-gray-600">out of 100</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              finalScore >= 80 ? 'bg-green-600' :
              finalScore >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${finalScore}%` }}
          />
        </div>
      </div>

      {/* Improvements */}
      {finalImprovements.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-900">Next improvements:</h5>
          <ul className="space-y-1">
            {finalImprovements.slice(0, 3).map((improvement, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-600">{improvement}</span>
              </li>
            ))}
          </ul>
          
          {finalImprovements.length > 3 && (
            <p className="text-xs text-gray-500">
              +{finalImprovements.length - 3} more improvements
            </p>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link
          href="/profile/edit"
          className="block w-full text-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Improve Profile
        </Link>
      </div>

      {/* Empty state for perfect score */}
      {finalScore >= 100 && (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Perfect Score!</h4>
          <p className="text-sm text-gray-600">Your profile is optimized for maximum visibility.</p>
        </div>
      )}
    </Card>
  );
}
