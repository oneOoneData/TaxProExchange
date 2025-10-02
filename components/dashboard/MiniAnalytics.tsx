import Link from 'next/link';
import Card from '@/components/ui/Card';

interface AnalyticsData {
  profileViews: number;
  directoryImpressions: number;
  connectionRequests: number;
  acceptedConnections: number;
  period: string;
}

interface MiniAnalyticsProps {
  data?: AnalyticsData;
}

export default function MiniAnalytics({ data }: MiniAnalyticsProps) {
  // Use real analytics data or show empty state
  const analyticsData: AnalyticsData = data ?? {
    profileViews: 0,
    directoryImpressions: 0,
    connectionRequests: 0,
    acceptedConnections: 0,
    period: 'Last 7 days'
  };

  const metrics = [
    {
      label: 'Profile Views',
      value: analyticsData.profileViews,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Directory Impressions',
      value: analyticsData.directoryImpressions,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Connection Requests',
      value: analyticsData.connectionRequests,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Accepted Connections',
      value: analyticsData.acceptedConnections,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <Card 
      title="Activity & Analytics" 
      description={analyticsData.period}
    >
      {analyticsData.profileViews === 0 && analyticsData.directoryImpressions === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">No activity yet</h4>
          <p className="text-sm text-gray-600 mb-3">Complete your profile to start tracking analytics.</p>
          <Link
            href="/profile/edit"
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 ${metric.bgColor} rounded-full flex items-center justify-center`}>
                  <div className={metric.color}>
                    {metric.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold text-gray-900">
                    {metric.value}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {metric.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sparkline placeholder */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Profile Views Trend</span>
              <span className="text-xs text-gray-500">7 days</span>
            </div>
            <div className="h-8 bg-gray-100 rounded flex items-end justify-between px-2 py-1">
              {[2, 4, 3, 6, 5, 8, 12].map((height, index) => (
                <div
                  key={index}
                  className="bg-blue-600 rounded-sm"
                  style={{ 
                    width: '8px', 
                    height: `${(height / 12) * 100}%`,
                    minHeight: '2px'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Coming soon notice */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>More detailed analytics coming soon</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
