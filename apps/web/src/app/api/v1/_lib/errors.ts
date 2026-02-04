import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR';

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const statusMap: Record<ApiErrorCode, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
    VALIDATION_ERROR: 422,
  };

  return NextResponse.json(
    { error: { code, message, details } },
    { status: statusMap[code] }
  );
}

export function unauthorized(message = 'Authentication required') {
  return errorResponse('UNAUTHORIZED', message);
}

export function forbidden(message = 'Access denied') {
  return errorResponse('FORBIDDEN', message);
}

export function notFound(message = 'Resource not found') {
  return errorResponse('NOT_FOUND', message);
}

export function badRequest(message: string, details?: unknown) {
  return errorResponse('BAD_REQUEST', message, details);
}

export function rateLimited(message = 'Too many requests') {
  return errorResponse('RATE_LIMITED', message);
}

export function internalError(message = 'Internal server error') {
  return errorResponse('INTERNAL_ERROR', message);
}

export function validationError(message: string, details?: unknown) {
  return errorResponse('VALIDATION_ERROR', message, details);
}
