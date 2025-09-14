'use client';

import { useEffect } from 'react';
import { generateFaqJsonLd } from '@/lib/seo';

interface FaqItem {
  question: string;
  answer: string;
}

interface SeoFaqJsonLdProps {
  faqs: FaqItem[];
}

export default function SeoFaqJsonLd({ faqs }: SeoFaqJsonLdProps) {
  useEffect(() => {
    if (faqs.length === 0) return;

    const faqJsonLd = generateFaqJsonLd(faqs);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqJsonLd);

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [faqs]);

  return null; // This component doesn't render anything
}
