/**
 * Google reCAPTCHA v3 utilities for bot protection
 */

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify reCAPTCHA token on the server side
 * @param token - The reCAPTCHA token from the client
 * @param minScore - Minimum score required (0.0 - 1.0, default 0.5)
 * @returns Object with success status and score
 */
export async function verifyRecaptcha(
  token: string,
  minScore: number = 0.5
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not configured');
    return { 
      success: false, 
      error: 'reCAPTCHA is not properly configured' 
    };
  }

  if (!token) {
    return { 
      success: false, 
      error: 'reCAPTCHA token is missing' 
    };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return { 
        success: false, 
        error: 'reCAPTCHA verification failed',
      };
    }

    const score = data.score || 0;

    // Check if score meets minimum threshold
    if (score < minScore) {
      console.warn(`reCAPTCHA score too low: ${score} (required: ${minScore})`);
      return { 
        success: false, 
        score,
        error: 'reCAPTCHA score too low. Please try again.',
      };
    }

    return { 
      success: true, 
      score 
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { 
      success: false, 
      error: 'Failed to verify reCAPTCHA' 
    };
  }
}

/**
 * Execute reCAPTCHA on the client side
 * @param action - The action name for this reCAPTCHA execution
 * @returns Promise with the reCAPTCHA token
 */
export async function executeRecaptcha(action: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('executeRecaptcha can only be called on the client'));
      return;
    }

    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      reject(new Error('NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not configured'));
      return;
    }

    // Wait for grecaptcha to be ready
    const checkRecaptcha = setInterval(() => {
      if (window.grecaptcha?.ready) {
        clearInterval(checkRecaptcha);
        
        window.grecaptcha.ready(() => {
          if (!window.grecaptcha) {
            reject(new Error('reCAPTCHA not available'));
            return;
          }
          
          window.grecaptcha
            .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!, { action })
            .then(resolve)
            .catch(reject);
        });
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkRecaptcha);
      reject(new Error('reCAPTCHA loading timeout'));
    }, 10000);
  });
}

// Type definitions for grecaptcha
declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

