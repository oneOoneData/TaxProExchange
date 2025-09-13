export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="container-mobile py-3 flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
      
      <div className="py-8">
        <div className="container-mobile">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>

        {/* Onboarding checklist skeleton */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>

        {/* Main content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column - Profile Status and Verification */}
          <div className="lg:col-span-6 space-y-6">
            {/* Profile Status Card skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Verification Card skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Quick Actions and Activity */}
          <div className="lg:col-span-6 space-y-6">
            {/* Quick Actions Card skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>

            {/* Activity Feed Card skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
