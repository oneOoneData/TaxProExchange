import { createClient } from '@supabase/supabase-js';

/**
 * Create a server-side Supabase client with service role key
 * This bypasses RLS and should only be used in server-side contexts
 */
export function createServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
}
