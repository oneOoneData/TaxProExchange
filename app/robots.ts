import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: ['/', '/search', '/trust', '/transparency', '/p/'],
      disallow: ['/join', '/verify', '/profile', '/onboarding', '/api/', '/admin/', '/dashboard/', '/messages/']
    }],
    sitemap: 'https://www.taxproexchange.com/sitemap.xml'
  };
}
