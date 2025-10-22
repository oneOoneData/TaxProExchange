/**
 * PROPOSED: Auto-sync clerk_id on every authenticated request
 * 
 * Add this to your middleware.ts to automatically keep clerk_id in sync
 * This prevents the mismatch issue from ever occurring
 */

import { auth } from '@clerk/nextjs/server';
import { supabaseService } from '@/lib/supabaseService';

export async function syncClerkIdMiddleware() {
  const { userId } = await auth();
  
  if (!userId) {
    return; // Not authenticated, skip
  }

  // Get user's email from Clerk
  let userEmail: string | null = null;
  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const userData = await response.json();
      const primaryEmail = userData.email_addresses?.find(
        (e: any) => e.id === userData.primary_email_address_id
      );
      userEmail = primaryEmail?.email_address || userData.email_addresses?.[0]?.email_address;
    }
  } catch (error) {
    console.warn('Could not fetch email from Clerk:', error);
    return; // Fail silently, don't block request
  }

  if (!userEmail) return;

  // Check if profile exists and clerk_id needs updating
  const supabase = supabaseService();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, clerk_id')
    .eq('public_email', userEmail)
    .maybeSingle();

  if (profile && profile.clerk_id !== userId) {
    // Clerk ID has changed - sync it
    console.log(`🔄 Syncing clerk_id for ${userEmail}: ${profile.clerk_id} → ${userId}`);
    
    await supabase
      .from('profiles')
      .update({ clerk_id: userId })
      .eq('id', profile.id);
  }
}

/**
 * Usage in middleware.ts:
 * 
 * export async function middleware(request: NextRequest) {
 *   // ... existing middleware code ...
 *   
 *   // Sync clerk_id on protected routes
 *   if (request.nextUrl.pathname.startsWith('/dashboard') ||
 *       request.nextUrl.pathname.startsWith('/profile') ||
 *       request.nextUrl.pathname.startsWith('/onboarding')) {
 *     await syncClerkIdMiddleware();
 *   }
 *   
 *   // ... rest of middleware ...
 * }
 */

