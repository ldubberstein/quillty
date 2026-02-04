import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@quillty/api';

/**
 * Server-side Supabase client with service role key.
 * This bypasses RLS and should only be used in API routes.
 * NEVER expose this client to the browser.
 */
export function createServiceClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
        'Get it from your Supabase Dashboard > Settings > API > service_role key'
    );
  }

  // Validate key format (should be a JWT starting with 'ey')
  if (!serviceRoleKey.startsWith('ey')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY appears to be invalid. ' +
        'It should be a JWT token starting with "ey". ' +
        'Get it from your Supabase Dashboard > Settings > API > service_role key (not the anon key)'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
