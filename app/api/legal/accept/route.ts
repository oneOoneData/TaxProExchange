import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LEGAL_VERSIONS } from '@/lib/legal';

function supabaseService() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { acceptTos, acceptPrivacy } = await req.json();
    
    if (!acceptTos && !acceptPrivacy) {
      return new Response('No legal documents specified for acceptance', { status: 400 });
    }

    const supabase = supabaseService();
    const now = new Date().toISOString();
    
    const patch: any = {};

    if (acceptTos) {
      patch.tos_version = LEGAL_VERSIONS.TOS;
      patch.tos_accepted_at = now;
    }

    if (acceptPrivacy) {
      patch.privacy_version = LEGAL_VERSIONS.PRIVACY;
      patch.privacy_accepted_at = now;
    }

    // Update profiles by clerk_id mapping
    const { error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('clerk_id', userId);

    if (error) {
      console.error('Legal acceptance update error:', error);
      return new Response(error.message, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      accepted: {
        tos: acceptTos ? LEGAL_VERSIONS.TOS : null,
        privacy: acceptPrivacy ? LEGAL_VERSIONS.PRIVACY : null
      }
    });

  } catch (error) {
    console.error('Legal acceptance error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
