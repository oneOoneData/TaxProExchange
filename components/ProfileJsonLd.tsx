'use client';

import { useEffect } from 'react';
import { generateProfessionalServiceJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';

interface ProfileJsonLdProps {
  profile: {
    id: string;
    slug: string;
    first_name: string;
    last_name: string;
    headline?: string;
    bio?: string;
    credential_type: string;
    avatar_url?: string | null;
    states?: string[];
    linkedin_url?: string;
    firm_name?: string;
  };
}

export default function ProfileJsonLd({ profile }: ProfileJsonLdProps) {
  useEffect(() => {
    // Generate ProfessionalService JSON-LD
    const professionalServiceJsonLd = generateProfessionalServiceJsonLd({
      firstName: profile.first_name,
      lastName: profile.last_name,
      credentialType: profile.credential_type,
      slug: profile.slug,
      headline: profile.headline,
      bio: profile.bio,
      avatarUrl: profile.avatar_url || undefined,
      states: profile.states,
      linkedinUrl: profile.linkedin_url,
      firmName: profile.firm_name,
    });

    // Generate Breadcrumb JSON-LD
    const breadcrumbJsonLd = generateBreadcrumbJsonLd([
      { name: 'Home', url: 'https://www.taxproexchange.com/' },
      { name: 'Directory', url: 'https://www.taxproexchange.com/search' },
      { name: `${profile.first_name} ${profile.last_name}`, url: `https://www.taxproexchange.com/p/${profile.slug}` },
    ]);

    // Create script elements
    const professionalServiceScript = document.createElement('script');
    professionalServiceScript.type = 'application/ld+json';
    professionalServiceScript.text = JSON.stringify(professionalServiceJsonLd);

    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.text = JSON.stringify(breadcrumbJsonLd);

    // Add to head
    document.head.appendChild(professionalServiceScript);
    document.head.appendChild(breadcrumbScript);

    // Cleanup function
    return () => {
      document.head.removeChild(professionalServiceScript);
      document.head.removeChild(breadcrumbScript);
    };
  }, [profile]);

  return null; // This component doesn't render anything
}
