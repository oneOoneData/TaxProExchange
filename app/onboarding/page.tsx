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
    .select('id, tos_version, privacy_version, credential_type')
    .eq('clerk_id', user.id)
    .single();

  console.log('[onboarding] existingProfile:', existingProfile);

  if (existingProfile) {
    // User has completed onboarding, redirect to profile edit
    console.log('[onboarding] redirecting to profile edit');
    redirect('/profile/edit');
  }

  // New user - redirect directly to credentials step
  redirect('/onboarding/credentials');
}
