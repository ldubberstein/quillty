import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mocks that can be referenced in vi.mock
const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

// Mock supabase before importing http-client
vi.mock('./client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

import { createApiClient, ApiError } from './http-client';

describe('HTTP Client', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    mockGetSession.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('createApiClient', () => {
    it('should create client with default base URL in browser', () => {
      // Mock window
      const originalWindow = global.window;
      global.window = { location: { origin: 'https://example.com' } } as Window & typeof globalThis;

      const client = createApiClient();
      expect(client).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
      expect(typeof client.patch).toBe('function');
      expect(typeof client.put).toBe('function');
      expect(typeof client.delete).toBe('function');

      global.window = originalWindow;
    });

    it('should use custom base URL when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const client = createApiClient({ baseUrl: 'https://custom-api.com' });
      await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.com/api/v1/test',
        expect.any(Object)
      );
    });
  });

  describe('request methods', () => {
    const client = createApiClient({ baseUrl: 'https://api.test.com' });

    it('should make GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'get response' }),
      });

      const result = await client.get<{ data: string }>('/resource');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/resource',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          credentials: 'include',
        })
      );
      expect(result).toEqual({ data: 'get response' });
    });

    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: 'created' }),
      });

      const body = { name: 'test' };
      const result = await client.post<{ data: string }>('/resource', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/resource',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual({ data: 'created' });
    });

    it('should make PATCH request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'updated' }),
      });

      const body = { name: 'updated' };
      await client.patch('/resource/1', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/resource/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      );
    });

    it('should make PUT request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'replaced' }),
      });

      const body = { name: 'replaced' };
      await client.put('/resource/1', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/resource/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
        })
      );
    });

    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.delete('/resource/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/resource/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await client.delete('/resource/1');
      expect(result).toBeUndefined();
    });
  });

  describe('authentication', () => {
    it('should add Authorization header when getAccessToken is provided', async () => {
      const getAccessToken = vi.fn().mockResolvedValue('test-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const client = createApiClient({
        baseUrl: 'https://api.test.com',
        getAccessToken,
      });

      await client.get('/protected');

      expect(getAccessToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should not add Authorization header when token is null', async () => {
      const getAccessToken = vi.fn().mockResolvedValue(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const client = createApiClient({
        baseUrl: 'https://api.test.com',
        getAccessToken,
      });

      await client.get('/public');

      const fetchCall = mockFetch.mock.calls[0];
      const headers = fetchCall[1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('error handling', () => {
    const client = createApiClient({ baseUrl: 'https://api.test.com' });

    it('should throw ApiError on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid input',
            },
          }),
      });

      await expect(client.get('/bad-request')).rejects.toThrow(ApiError);

      try {
        await client.get('/bad-request');
      } catch {
        // Fetch was already called, this won't execute
      }
    });

    it('should include error details in ApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () =>
          Promise.resolve({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: { field: 'name' },
            },
          }),
      });

      try {
        await client.post('/validate', {});
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe('VALIDATION_ERROR');
        expect(apiError.message).toBe('Validation failed');
        expect(apiError.status).toBe(422);
        expect(apiError.details).toEqual({ field: 'name' });
      }
    });

    it('should handle missing error structure gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      try {
        await client.get('/error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe('UNKNOWN_ERROR');
        expect(apiError.message).toBe('An unknown error occurred');
      }
    });
  });
});

describe('ApiError', () => {
  it('should have correct properties', () => {
    const error = new ApiError('TEST_CODE', 'Test message', 400, { extra: 'data' });

    expect(error.name).toBe('ApiError');
    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.status).toBe(400);
    expect(error.details).toEqual({ extra: 'data' });
  });

  it('should be instanceof Error', () => {
    const error = new ApiError('TEST', 'Test', 500);
    expect(error).toBeInstanceOf(Error);
  });
});
