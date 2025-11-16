import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/for-firms',
          '/solutions/',
          '/search',
          '/p/',
          '/trust',
          '/transparency',
          '/legal/',
          '/jobs',
          '/events',
          '/mentorship',
        ],
        disallow: [
          '/join',
          '/onboarding/',
          '/profile/',
          '/dashboard/',
          '/messages/',
          '/api/',
          '/admin/',
          '/settings',
          '/refer',
          '/feedback',
          '/sign-in/',
          '/sign-up/',
          '/ai/write-for-us',
          '/suggest-event',
          '*?private=*',
        ],
      },
    ],
    sitemap: 'https://www.taxproexchange.com/sitemap.xml',
  };
}

