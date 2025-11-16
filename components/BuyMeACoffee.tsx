'use client';

import Image from 'next/image';

export default function BuyMeACoffee() {
  return (
    <div className="mt-3">
      <a 
        href="https://www.buymeacoffee.com/koenf" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block hover:scale-105 transition-transform duration-200"
      >
        <Image 
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
          alt="Buy Me A Coffee" 
          width={145}
          height={40}
          className="rounded-lg shadow-sm hover:shadow-md"
          unoptimized
          priority={false}
        />
      </a>
    </div>
  );
}
