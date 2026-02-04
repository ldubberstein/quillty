import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase client creation
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear module cache to allow re-import with fresh mocks
    vi.resetModules();
  });

  it('exports createClient function', async () => {
    const { createClient } = await import('./client');
    expect(typeof createClient).toBe('function');
  });

  it('exports supabase instance', async () => {
    const { supabase } = await import('./client');
    expect(supabase).toBeDefined();
  });

  it('createClient returns a supabase client', async () => {
    const { createClient } = await import('./client');
    const client = createClient();
    expect(client).toBeDefined();
  });
});
