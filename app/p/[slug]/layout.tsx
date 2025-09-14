import type { Metadata } from 'next';
import { generateTitle, generateDescription, absoluteCanonical } from '@/lib/seo';

interface ProfileLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProfileLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    // Fetch profile data for metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.taxproexchange.com'}/api/profile/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (response.ok) {
      const profile = await response.json();
      
      const title = generateTitle(`${profile.first_name} ${profile.last_name}, ${profile.credential_type}`);
      const description = generateDescription(
        `${profile.first_name} ${profile.last_name} is a verified ${profile.credential_type} specializing in ${profile.specializations?.slice(0, 3).join(', ') || 'tax services'}. ${profile.headline || profile.bio?.substring(0, 100) || ''} Located in ${profile.primary_location?.state || 'multiple states'}.`
      );
      
      return {
        title,
        description,
        alternates: {
          canonical: absoluteCanonical(`/p/${slug}`),
        },
        openGraph: {
          title,
          description,
          url: absoluteCanonical(`/p/${slug}`),
          type: 'profile',
          images: profile.avatar_url ? [profile.avatar_url] : undefined,
        },
        twitter: {
          title,
          description,
          images: profile.avatar_url ? [profile.avatar_url] : undefined,
        },
      };
    }
  } catch (error) {
    console.error('Error fetching profile for metadata:', error);
  }
  
  // Fallback metadata
  return {
    title: generateTitle('Tax Professional Profile'),
    description: generateDescription('View detailed information about this verified tax professional.'),
    alternates: {
      canonical: absoluteCanonical(`/p/${slug}`),
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
