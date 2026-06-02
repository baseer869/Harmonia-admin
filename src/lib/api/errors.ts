import type { ApiErrorShape } from '@/types';

/** Transport-agnostic application error with a stable machine code. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  toJSON(): ApiErrorShape {
    return { code: this.code, message: this.message, details: this.details };
  }

  static notFound(message = 'Resource not found') {
    return new ApiError('NOT_FOUND', message, 404);
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError('UNAUTHORIZED', message, 401);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError('FORBIDDEN', message, 403);
  }
  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError('BAD_REQUEST', message, 400, details);
  }
}
