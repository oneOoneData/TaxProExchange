import { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { siteUrl, generateFaqJsonLd, generateOrganizationJsonLd, websiteSearchLD } from '@/lib/seo';
import HomePageClient from '@/components/HomePageClient';

export const metadata: Metadata = {
  title: 'Verified CPAs & EAs for Overflow, Reviews & Niche Tax Work | TaxProExchange',
  description: 'Scale your tax firm without full-time hires. Verified CPAs & EAs for overflow staffing, review & sign-off, IRS representation, multi-state SALT, crypto, trusts, K-1 surge support.',
  keywords: 'tax professionals, CPA, EA, overflow staffing, review and signoff, IRS representation, SALT, crypto tax, trusts estates, K-1 partnership returns, white label tax prep',
  alternates: { canonical: siteUrl },
  openGraph: {
    title: 'Verified CPAs & EAs for Overflow, Reviews & Niche Tax Work',
    description: 'Scale your tax firm without full-time hires. Verified CPAs & EAs for overflow staffing, review & sign-off, and niche work.',
    url: siteUrl,
    type: 'website',
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verified CPAs & EAs for Overflow, Reviews & Niche Tax Work',
    description: 'Scale your tax firm without full-time hires. Verified CPAs & EAs for overflow staffing, review & sign-off, and niche work.',
  },
};

  const faqs = [
    {
      question: 'Do you process payments or hold funds?',
      answer: 'No. TaxProExchange is a connection-only platform. Professionals handle contracts and payments off-platform.'
    },
    {
      question: 'How do you verify credentials?',
      answer: 'We manually check state CPA boards, IRS EA enrollment, and CTEC registration before profiles are visible.'
    },
    {
      question: 'Is it free?',
      answer: 'Yes for individuals — forever. Tax professionals can join free, create profiles, and connect with others at no cost. Firms pay $10/month to access team workspace features and build their trusted bench.'
    },
    {
      question: 'Can clients use this?',
      answer: 'This is built for professionals only: CPAs, EAs, and registered preparers who need collaboration and referrals.'
    },
    {
      question: 'What about mentorship and events?',
      answer: 'Beyond the directory and job board, we offer mentorship matching and curated events like webinars and workshops to help you grow professionally.'
    }
  ];

export default function HomePage() {
  const organizationSchema = generateOrganizationJsonLd();
  const websiteSchema = websiteSearchLD();
  const faqSchema = generateFaqJsonLd(faqs);

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={faqSchema} />
      
      <HomePageClient faqs={faqs} />
    </>
  );
}
