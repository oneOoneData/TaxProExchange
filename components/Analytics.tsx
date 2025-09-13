'use client';

import Script from 'next/script';

interface AnalyticsProps {
  measurementId: string;
}

export default function Analytics({ measurementId }: AnalyticsProps) {
  // Only load analytics in production and on www domain
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  // Check if we're on the correct domain (client-side)
  if (typeof window !== 'undefined' && window.location.hostname !== 'www.taxproexchange.com') {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
