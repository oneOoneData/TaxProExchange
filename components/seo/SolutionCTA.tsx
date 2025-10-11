/**
 * Call-to-action component for solution pages
 * Links to filtered search with appropriate tracking
 */

'use client';

interface SolutionCTAProps {
  to: string;
  children: React.ReactNode;
}

export default function SolutionCTA({ to, children }: SolutionCTAProps) {
  const handleClick = () => {
    // Fire analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click_browse_verified_pros', {
        destination: to,
      });
    }
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className="inline-flex items-center px-6 py-3 text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all"
    >
      {children}
    </a>
  );
}

