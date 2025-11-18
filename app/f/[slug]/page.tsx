/**
 * Public Firm Profile Page
 * 
 * Display firm information and public team members.
 * Gated by FEATURE_FIRM_WORKSPACES flag.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';
import { siteUrl } from '@/lib/seo';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  if (!FEATURE_FIRM_WORKSPACES) {
    return {
      title: 'Firm Not Found | TaxProExchange',
      robots: { index: false, follow: false },
    };
  }

  const supabase = createServerClient();
  const { data: firm, error } = await supabase
    .from('firms')
    .select('name, verified')
    .eq('slug', slug)
    .single();

  if (error || !firm) {
    return {
      title: 'Firm Not Found | TaxProExchange',
      robots: { index: false, follow: false },
    };
  }

  const title = `${firm.name}${firm.verified ? ' – Verified Firm' : ''} | TaxProExchange`;
  const description = `View ${firm.name}'s team of verified tax professionals on TaxProExchange. Find CPAs, EAs, and tax preparers for your firm.`;
  const url = `${siteUrl}/f/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function FirmProfilePage({ params }: PageProps) {
  // Feature gate
  if (!FEATURE_FIRM_WORKSPACES) {
    return notFound();
  }

  const { slug } = await params;
  const supabase = createServerClient();

  // Fetch firm
  const { data: firm, error: firmError } = await supabase
    .from('firms')
    .select('*')
    .eq('slug', slug)
    .single();

  if (firmError || !firm) {
    return notFound();
  }

  // Fetch public bench items
  const { data: benchItems } = await supabase
    .from('firm_trusted_bench')
    .select(`
      id,
      custom_title,
      categories,
      priority,
      profiles:trusted_profile_id (
        id,
        first_name,
        last_name,
        credential_type,
        slug,
        firm_name,
        avatar_url,
        image_url,
        headline,
        is_listed,
        visibility_state
      )
    `)
    .eq('firm_id', firm.id)
    .eq('visibility_public', true)
    .order('priority', { ascending: true });

  // Filter to only show available profiles
  const publicTeam = (benchItems || []).filter(
    (item: any) =>
      item.profiles &&
      item.profiles.is_listed &&
      item.profiles.visibility_state === 'listed'
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {firm.name}
              </h1>
              {firm.verified && (
                <div className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Firm
                </div>
              )}
            </div>

            {firm.website && (
              <a
                href={firm.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Visit Website
              </a>
            )}
          </div>

          {/* Firm Details */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600">
            {firm.size_band && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span><strong>Team Size:</strong> {firm.size_band} employees</span>
              </div>
            )}
            {firm.returns_band && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span><strong>Returns:</strong> {firm.returns_band} annually</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Our Team Section */}
      {publicTeam.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Trusted Professionals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTeam.map((item: any) => {
              const profile = item.profiles;
              const avatarUrl = profile.image_url || profile.avatar_url;

              return (
                <Link
                  key={item.id}
                  href={`/p/${profile.slug}`}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Avatar */}
                  <div className="flex items-start gap-4 mb-4">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={`${profile.first_name} ${profile.last_name}`}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                        {profile.first_name[0]}{profile.last_name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{profile.credential_type}</p>
                    </div>
                  </div>

                  {/* Custom Title */}
                  {item.custom_title && (
                    <p className="text-sm font-medium text-blue-600 mb-3">
                      {item.custom_title}
                    </p>
                  )}

                  {/* Firm Name */}
                  {profile.firm_name && (
                    <p className="text-sm text-gray-600 mb-2">{profile.firm_name}</p>
                  )}

                  {/* Headline */}
                  {profile.headline && (
                    <p className="text-sm text-gray-600 line-clamp-2">{profile.headline}</p>
                  )}

                  {/* Categories */}
                  {item.categories && item.categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.categories.slice(0, 3).map((cat: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {publicTeam.length === 0 && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">
              This firm hasn&apos;t added any public team members yet.
            </p>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Looking for verified tax professionals?
          </h2>
          <p className="text-gray-600 mb-6">
            Join TaxProExchange to connect with CPAs, EAs, and tax preparers for your firm or practice.
          </p>
          <Link
            href="/search"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Browse Directory
          </Link>
        </div>
      </div>
    </main>
  );
}

