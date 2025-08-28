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

  const email = user.emailAddresses?.[0]?.emailAddress ?? null;
  const first = user.firstName ?? null;
  const last = user.lastName ?? null;
  const image = user.imageUrl ?? null;

  const supabase = supabaseService();
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { clerk_id: user.id, email, first_name: first, last_name: last, image_url: image },
      { onConflict: 'clerk_id' }
    );

  if (error) {
    console.error('onboarding upsert error:', error);
    redirect('/'); // do not block session if upsert fails
  }

  redirect('/profile/edit');
}
