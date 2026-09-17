import { Metadata } from 'next';
import { supabaseService } from '@/lib/supabaseService';
import { siteUrl } from '@/lib/seo';
import JobDetailClient from './JobDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = supabaseService();

  const { data: job } = await supabase
    .from('jobs')
    .select('title, description, created_by')
    .eq('id', id)
    .single();

  if (!job) {
    return {
      title: 'Job Not Found | TaxProExchange',
      robots: { index: false, follow: false },
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_name, first_name, last_name')
    .eq('clerk_id', job.created_by)
    .single();

  const firmName = profile?.firm_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || undefined;
  const title = `${job.title} | TaxProExchange`;
  const description = firmName
    ? `${firmName} is hiring on TaxProExchange: ${job.description.slice(0, 150)}`
    : job.description.slice(0, 160);
  const url = `${siteUrl}/jobs/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'TaxProExchange - Verified Tax Professionals Directory',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}
