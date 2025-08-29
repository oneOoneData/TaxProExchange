import Link from 'next/link';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <Link 
      href="/" 
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      {/* Logo Icon */}
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">
        TX
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className="font-semibold text-slate-900">TaxProExchange</span>
      )}
    </Link>
  );
}
