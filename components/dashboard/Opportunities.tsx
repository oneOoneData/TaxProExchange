import Link from 'next/link';
import { Profile } from '@/lib/db/profile';
import Card from '@/components/ui/Card';
import { useEffect, useState } from 'react';

interface Opportunity {
  id: string;
  name: string;
  credential: string;
  location: string;
  specialties: string[];
  reason: string;
  avatar?: string;
  slug?: string;
}

interface OpportunitiesProps {
  profile: Profile | null;
  opportunities?: Opportunity[];
}

export default function Opportunities({ profile, opportunities = [] }: OpportunitiesProps) {
  const [opportunityList, setOpportunityList] = useState<Opportunity[]>(opportunities);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile && opportunities.length === 0) {
      fetchOpportunities();
    }
  }, [profile]);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard/opportunities');
      if (response.ok) {
        const data = await response.json();
        setOpportunityList(data.opportunities || []);
      } else {
        console.error('Failed to fetch opportunities');
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <Card title="Tax Pros that match your Profile" description="Discover tax professionals">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Tax Pros that match your Profile" 
      description="Based on your location, specializations, and software"
      action={
        <Link 
          href="/search"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : opportunityList.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">No matches found</h4>
          <p className="text-sm text-gray-600 mb-3">We couldn't find any tax professionals matching your profile right now.</p>
          <Link
            href="/search"
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunityList.slice(0, 3).map((opportunity) => (
            <div key={opportunity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {opportunity.avatar ? (
                  <img
                    src={opportunity.avatar}
                    alt={opportunity.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {opportunity.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {opportunity.name}
                  </h4>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {opportunity.credential}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 mb-1">{opportunity.location}</p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {opportunity.specialties.slice(0, 2).map((specialty) => (
                    <span 
                      key={specialty}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {specialty}
                    </span>
                  ))}
                  {opportunity.specialties.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{opportunity.specialties.length - 2} more
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 italic">{opportunity.reason}</p>
              </div>
              
              <div className="flex-shrink-0">
                <Link
                  href={opportunity.slug ? `/p/${opportunity.slug}` : `/p/${opportunity.id}`}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
          
          {opportunityList.length > 3 && (
            <div className="text-center">
              <Link
                href="/search"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View {opportunityList.length - 3} more suggestions
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
