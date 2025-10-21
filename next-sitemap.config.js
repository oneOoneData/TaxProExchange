/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.taxproexchange.com',
  generateRobotsTxt: true,
  exclude: [
    '/join',
    '/join/*',
    '/profile/edit',
    '/profile/*',
    '/onboarding',
    '/onboarding/*',
    '/api/*',
    '/app/*',
    '/admin/*',
    '/messages/*',
    '/settings/*',
    '/feedback/*',
    '/test-*',
    '/cleanup-*',
    '/reddit/*',
    '/refer/*',
    '/sign-in/*',
    '/sign-up/*',
    '/sitemap.xml',
    '/robots.txt',
  ],
  transform: async (config, path) => {
    // Profile pages are crown jewels (0.9 priority)
    // Marketing pages get standard priority (0.7)
    let priority = 0.7;
    let changefreq = 'weekly';
    
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path === '/search') {
      priority = 0.9;
      changefreq = 'daily';
    } else if (path.startsWith('/p/')) {
      priority = 0.9; // Profile pages = crown jewels
      changefreq = 'weekly';
    } else if (path.startsWith('/partners/')) {
      priority = 0.8;
      changefreq = 'monthly';
    } else if (path.startsWith('/jobs/') && !path.includes('/new')) {
      priority = 0.8;
      changefreq = 'daily';
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { 
        userAgent: '*', 
        disallow: [
          '/join',
          '/profile/edit',
          '/profile/*',
          '/onboarding',
          '/api',
          '/app/*',
          '/admin/*',
          '/messages/*',
          '/settings/*',
          '/feedback/*',
          '/test-*',
          '/cleanup-*',
          '/reddit/*',
          '/refer/*',
          '/sign-in/*',
          '/sign-up/*',
        ],
      },
    ],
  },
};
