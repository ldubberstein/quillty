import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { Database } from '@quillty/api';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthResult {
  user: AuthUser | null;
  error?: string;
}

/**
 * Validate authentication from request.
 * Checks Authorization header first, then falls back to cookies.
 */
export async function validateAuth(request: NextRequest): Promise<AuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: 'Missing Supabase configuration' };
  }

  // Check for Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return validateToken(supabaseUrl, supabaseAnonKey, token);
  }

  // Fall back to cookie-based auth
  return validateCookieAuth(supabaseUrl, supabaseAnonKey);
}

/**
 * Validate a JWT token
 */
async function validateToken(
  supabaseUrl: string,
  supabaseAnonKey: string,
  token: string
): Promise<AuthResult> {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
  };
}

/**
 * Validate auth from cookies (for SSR requests)
 */
async function validateCookieAuth(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<AuthResult> {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: error?.message };
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
  };
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const { user, error } = await validateAuth(request);

  if (!user) {
    throw new AuthError(error || 'Authentication required');
  }

  return user;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
