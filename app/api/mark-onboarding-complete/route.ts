// /app/api/mark-onboarding-complete/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const host = new URL(req.url).hostname;
  console.log(`[debug] Setting onboarding_complete for host: ${host}`);

  // Update the database to mark onboarding as complete
  try {
    const supabase = supabaseService();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        onboarding_complete: true,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userId);

    if (updateError) {
      console.error('Failed to update onboarding_complete in database:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update profile in database',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log(`[debug] Successfully updated onboarding_complete for user ${userId}`);
  } catch (dbError) {
    console.error('Database error updating onboarding_complete:', dbError);
    return NextResponse.json({ 
      error: 'Database error',
      details: dbError instanceof Error ? dbError.message : String(dbError)
    }, { status: 500 });
  }

  const cookie: Parameters<typeof NextResponse.prototype.cookies.set>[2] = {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Changed from true to false so JavaScript can read it
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };

  // Set domain based on environment - be more permissive
  if (host.endsWith('taxproexchange.com')) {
    cookie.domain = '.taxproexchange.com';
    console.log('[debug] Setting domain-scoped cookie for production');
  } else if (host === 'localhost' || host === '127.0.0.1') {
    // No domain for localhost - cookie will be host-only
    console.log('[debug] Setting host-only cookie for localhost');
  } else if (host.includes('vercel.app')) {
    // For Vercel, try to set a broader domain
    const parts = host.split('.');
    if (parts.length >= 3) {
      cookie.domain = `.${parts.slice(-2).join('.')}`;
      console.log(`[debug] Setting domain-scoped cookie for Vercel: ${cookie.domain}`);
    } else {
      console.log('[debug] Setting host-only cookie for Vercel (could not determine domain)');
    }
  }

  const res = NextResponse.json({ 
    ok: true, 
    host,
    cookieDomain: cookie.domain || 'host-only',
    message: 'Onboarding marked as complete in database and cookie'
  });
  
  // Set the cookie
  res.cookies.set('onboarding_complete', '1', cookie);
  
  // Also set a header as backup
  res.headers.set('x-onboarding-complete', '1');
  
  // Add debug headers
  res.headers.set('x-debug-cookie-set', 'true');
  res.headers.set('x-debug-cookie-domain', cookie.domain || 'host-only');
  
  return res;
}
