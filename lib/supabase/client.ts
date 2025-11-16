import { createClient } from '@supabase/supabase-js';

/**
 * Create a client-side Supabase client with anonymous key
 * This respects RLS policies and should be used in client-side contexts
 */
export function createClientClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

