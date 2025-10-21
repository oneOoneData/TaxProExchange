/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now stable in Next.js 14, no need for experimental flag
  productionBrowserSourceMaps: true,
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/**',
      },
    ],
  },
  
  // SEO: Force canonical domain (https + www) and normalize trailing slashes
  async redirects() {
    return [
      // Redirect /app/* to app subdomain
      {
        source: '/app/:path*',
        destination: 'https://app.taxproexchange.com/:path*',
        permanent: true,
      },
      // Force non-www to www (301 redirect)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'taxproexchange.com' }],
        destination: 'https://www.taxproexchange.com/:path*',
        permanent: true,
      },
      // Remove trailing slashes (except root) to prevent canonical loops
      {
        source: '/:path+/',
        destination: '/:path+',
        permanent: true,
      },
    ];
  },
  
  // Disable automatic trailing slash to prevent conflicts
  trailingSlash: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // HSTS - commented out until both domains are fully green
          // {
          //   key: 'Strict-Transport-Security',
          //   value: 'max-age=31536000; includeSubDomains; preload',
          // },
        ],
      },
    ];
  },
}

module.exports = {
  ...nextConfig,
  productionBrowserSourceMaps: true
}
