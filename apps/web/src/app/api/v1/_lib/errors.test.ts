import { describe, it, expect } from 'vitest';
import {
  errorResponse,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  rateLimited,
  internalError,
  validationError,
} from './errors';

describe('API Error Utilities', () => {
  describe('errorResponse', () => {
    it('should create error response with correct structure', async () => {
      const response = errorResponse('BAD_REQUEST', 'Test error message');
      const body = await response.json();

      expect(body).toEqual({
        error: {
          code: 'BAD_REQUEST',
          message: 'Test error message',
        },
      });
      expect(response.status).toBe(400);
    });

    it('should include details when provided', async () => {
      const details = { field: 'name', issue: 'required' };
      const response = errorResponse('VALIDATION_ERROR', 'Validation failed', details);
      const body = await response.json();

      expect(body.error.details).toEqual(details);
    });

    it('should map error codes to correct HTTP status', async () => {
      expect(errorResponse('UNAUTHORIZED', 'test').status).toBe(401);
      expect(errorResponse('FORBIDDEN', 'test').status).toBe(403);
      expect(errorResponse('NOT_FOUND', 'test').status).toBe(404);
      expect(errorResponse('BAD_REQUEST', 'test').status).toBe(400);
      expect(errorResponse('RATE_LIMITED', 'test').status).toBe(429);
      expect(errorResponse('INTERNAL_ERROR', 'test').status).toBe(500);
      expect(errorResponse('VALIDATION_ERROR', 'test').status).toBe(422);
    });
  });

  describe('unauthorized', () => {
    it('should return 401 with default message', async () => {
      const response = unauthorized();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toBe('Authentication required');
    });

    it('should accept custom message', async () => {
      const response = unauthorized('Custom auth message');
      const body = await response.json();

      expect(body.error.message).toBe('Custom auth message');
    });
  });

  describe('forbidden', () => {
    it('should return 403 with default message', async () => {
      const response = forbidden();
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toBe('Access denied');
    });
  });

  describe('notFound', () => {
    it('should return 404 with default message', async () => {
      const response = notFound();
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Resource not found');
    });
  });

  describe('badRequest', () => {
    it('should return 400 with message', async () => {
      const response = badRequest('Invalid input');
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toBe('Invalid input');
    });

    it('should include details when provided', async () => {
      const response = badRequest('Invalid input', { field: 'email' });
      const body = await response.json();

      expect(body.error.details).toEqual({ field: 'email' });
    });
  });

  describe('rateLimited', () => {
    it('should return 429 with default message', async () => {
      const response = rateLimited();
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.error.code).toBe('RATE_LIMITED');
      expect(body.error.message).toBe('Too many requests');
    });
  });

  describe('internalError', () => {
    it('should return 500 with default message', async () => {
      const response = internalError();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('Internal server error');
    });
  });

  describe('validationError', () => {
    it('should return 422 with message and details', async () => {
      const details = {
        fieldErrors: { name: ['Required'] },
        formErrors: [],
      };
      const response = validationError('Validation failed', details);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Validation failed');
      expect(body.error.details).toEqual(details);
    });
  });
});
