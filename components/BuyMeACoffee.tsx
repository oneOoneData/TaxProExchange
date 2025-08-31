'use client';

export default function BuyMeACoffee() {
  return (
    <div className="mt-3">
      <a 
        href="https://www.buymeacoffee.com/koenf" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block hover:scale-105 transition-transform duration-200"
      >
        <img 
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
          alt="Buy Me A Coffee" 
          style={{ height: '40px', width: '145px' }}
          className="rounded-lg shadow-sm hover:shadow-md"
        />
      </a>
    </div>
  );
}
