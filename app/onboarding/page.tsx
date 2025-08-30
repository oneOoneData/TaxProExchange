import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function supabaseService() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function Onboarding() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const supabase = supabaseService();
  
  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, tos_version, privacy_version')
    .eq('clerk_id', user.id)
    .single();

  if (existingProfile) {
    // Check if user has accepted current legal versions
    const { LEGAL_VERSIONS } = await import('@/lib/legal');
    
    if (existingProfile.tos_version !== LEGAL_VERSIONS.TOS || 
        existingProfile.privacy_version !== LEGAL_VERSIONS.PRIVACY) {
      // Redirect to legal consent if versions don't match
      redirect('/legal/consent');
    }
    
    // Profile exists and legal versions are current, redirect to edit
    redirect('/profile/edit');
  }

  // New user - redirect to consent page first
  redirect('/onboarding/consent');
}
