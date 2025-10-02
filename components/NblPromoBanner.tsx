'use client';

import { useEffect, useState } from 'react';

export default function NblPromoBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const sessionKey = 'nblPromoDismissedSession';
    const dismissedThisSession = sessionStorage.getItem(sessionKey);
    
    if (!dismissedThisSession) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    const sessionKey = 'nblPromoDismissedSession';
    sessionStorage.setItem(sessionKey, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="nbl-promo" 
      id="nblPromo" 
      role="region" 
      aria-label="NewBizLeads promotion"
    >
      <div className="nbl-inner">
        <div className="nbl-copy">
          <span className="nbl-copy-full">
            <strong>Find New Clients First.</strong> Be the first tax pro to reach newly registered businesses in your area.
          </span>
          <span className="nbl-copy-mobile">
            <strong>Find New Clients First.</strong>
          </span>
        </div>

        <a 
          className="nbl-text-link" 
          href="https://www.newbizleads.com" 
          aria-label="Explore NewBizLeads"
        >
          NEWBIZ<span className="orange-text">LEADS</span>
        </a>

        <button 
          className="nbl-close" 
          aria-label="Dismiss NewBizLeads promotion"
          onClick={handleDismiss}
        >
          &times;
        </button>
      </div>

      <style jsx>{`
        .nbl-promo {
          --nbl-bg: #0B0B0B;
          --nbl-border: #1E1E1E;
          --nbl-text: #FFFFFF;
          --nbl-muted: #C7C7C7;
          --nbl-orange: #FF6B00;
          --nbl-orange-hover: #E55F00;
          border-bottom: 1px solid var(--nbl-border);
          background:
            radial-gradient(circle at 8% 50%, rgba(255,107,0,0.12) 0, rgba(255,107,0,0.00) 42%),
            var(--nbl-bg);
          font-family: system-ui, -apple-system, Segoe UI, Inter, Roboto, Helvetica, Arial, sans-serif;
        }
        .nbl-inner {
          margin: 0 auto; 
          max-width: 1100px;
          padding: 10px 14px;
          display: flex; 
          align-items: center; 
          gap: 12px; 
          justify-content: center;
          text-align: center;
        }
        .nbl-logo { 
          flex: 0 0 auto; 
          display: flex; 
          align-items: center; 
        }
        .nbl-copy { 
          flex: 1 1 auto; 
          min-width: 0; 
          color: var(--nbl-muted); 
          font-size: 14px; 
          line-height: 1.35; 
        }
        .nbl-copy strong { 
          color: var(--nbl-text); 
          font-weight: 800; 
        }
        .nbl-text-link {
          flex: 0 0 auto;
          display: inline-flex; 
          align-items: center; 
          justify-content: center;
          color: var(--nbl-text); 
          text-decoration: none;
          padding: 8px 14px; 
          border: 2px solid var(--nbl-orange);
          border-radius: 8px; 
          font-weight: 800;
          white-space: nowrap; 
          transition: all .15s ease-in-out;
        }
        .nbl-text-link:hover { 
          background: var(--nbl-orange);
          color: #0B0B0B;
        }
        .nbl-text-link:focus { 
          outline: none; 
          box-shadow: 0 0 0 3px rgba(255,107,0,.35); 
        }
        .orange-text {
          color: var(--nbl-orange);
        }
        .nbl-text-link:hover .orange-text {
          color: #0B0B0B;
        }

        .nbl-close {
          background: none; 
          border: none; 
          color: var(--nbl-muted);
          font-size: 20px; 
          line-height: 1; 
          cursor: pointer;
          padding: 0 6px; 
          margin-left: 4px;
          transition: color .15s ease-in-out;
        }
        .nbl-close:hover { 
          color: var(--nbl-text); 
        }

        .nbl-copy-full {
          display: block;
        }
        .nbl-copy-mobile {
          display: none;
        }

        @media (max-width: 720px) {
          .nbl-inner { 
            padding: 10px 12px; 
            gap: 10px; 
          }
          .nbl-copy { 
            font-size: 13px; 
          }
          .nbl-copy-full {
            display: none;
          }
          .nbl-copy-mobile {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
