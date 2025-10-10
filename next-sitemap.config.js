/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.taxproexchange.com',
  generateRobotsTxt: false, // Using app/robots.ts instead
  exclude: ['/app/*', '/api/*', '/admin/*', '/onboarding/*', '/profile/*', '/messages/*', '/settings/*', '/feedback/*', '/test-*', '/cleanup-*', '/reddit/*', '/refer/*', '/join/*', '/sign-in/*', '/sign-up/*', '/sitemap.xml', '/robots.txt'],
  transform: async (config, path) => {
    // Set priority for important pages
    let priority = 0.7;
    
    if (path === '/') {
      priority = 1.0;
    } else if (path === '/search') {
      priority = 0.9;
    } else if (path.startsWith('/p/')) {
      priority = 0.8;
    } else if (path.startsWith('/jobs/') && !path.includes('/new')) {
      priority = 0.8;
    }
    
    return {
      loc: path,
      changefreq: 'weekly',
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/api/', '/admin/', '/onboarding/', '/profile/', '/messages/', '/settings/', '/feedback/', '/test-*', '/cleanup-*', '/reddit/', '/refer/', '/join/', '/sign-in/', '/sign-up/'],
      },
    ],
    additionalSitemaps: [
      'https://www.taxproexchange.com/sitemap.xml',
    ],
  },
};
