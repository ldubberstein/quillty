/**
 * HTTP Client for Quillty API
 *
 * Centralized client for making authenticated API requests.
 * Works in both web (cookie-based) and mobile (token-based) environments.
 */

import { supabase } from './client';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientConfig {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null>;
}

/**
 * Get the base URL for API requests
 */
function getDefaultBaseUrl(): string {
  // Next.js public env
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Expo public env
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Browser - use origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for dev
  return 'http://localhost:3000';
}

/**
 * Create an API client instance
 */
export function createApiClient(config?: Partial<ApiClientConfig>) {
  const baseUrl = config?.baseUrl || getDefaultBaseUrl();
  const getAccessToken = config?.getAccessToken;

  async function request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${baseUrl}/api/v1${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth header if token provider is configured (for mobile)
    if (getAccessToken) {
      const token = await getAccessToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      // Include cookies for web SSR/client
      credentials: 'include',
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
      const errorResponse = data as ApiErrorResponse;
      throw new ApiError(
        errorResponse.error?.code || 'UNKNOWN_ERROR',
        errorResponse.error?.message || 'An unknown error occurred',
        response.status,
        errorResponse.error?.details
      );
    }

    return data as T;
  }

  return {
    /**
     * GET request
     */
    get<T>(endpoint: string, options?: RequestInit): Promise<T> {
      return request<T>(endpoint, { ...options, method: 'GET' });
    },

    /**
     * POST request
     */
    post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
      return request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    /**
     * PATCH request
     */
    patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
      return request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    /**
     * PUT request
     */
    put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
      return request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    /**
     * DELETE request
     */
    delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
      return request<T>(endpoint, { ...options, method: 'DELETE' });
    },
  };
}

/**
 * Get access token from Supabase session
 */
async function getSupabaseAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// Default client instance - uses Supabase session token for auth
export const apiClient = createApiClient({
  getAccessToken: getSupabaseAccessToken,
});
