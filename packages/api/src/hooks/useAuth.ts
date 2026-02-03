import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User as AuthUser, Session } from '@supabase/supabase-js';
import { supabase } from '../client';
import type { User, UserUpdate } from '../types/models';

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return authState;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<User | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as User;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: UserUpdate): Promise<User> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('users')
        .update(updates as never)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as User;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data);
    },
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
      username,
      displayName,
    }: {
      email: string;
      password: string;
      username: string;
      displayName?: string;
    }) => {
      // Check username availability first
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
            display_name: displayName,
          },
        },
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: async (redirectTo?: string) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useSignInWithApple() {
  return useMutation({
    mutationFn: async (redirectTo?: string) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ email, redirectUrl }: { email: string; redirectUrl?: string }) => {
      // Use provided redirectUrl, or safely detect web origin, or omit for mobile
      const redirectTo =
        redirectUrl ??
        (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
  });
}

export function useCheckUsername() {
  return useCallback(async (username: string): Promise<boolean> => {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    return !data; // Returns true if username is available
  }, []);
}
