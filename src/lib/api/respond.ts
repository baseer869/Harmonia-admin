import { NextResponse } from 'next/server';
import type { ApiResult } from '@/types';
import { ForbiddenError } from '@/lib/auth/rbac';
import { ApiError } from './errors';

/** Wrap data in the standard success envelope. */
export function ok<T>(data: T, status = 200): NextResponse<ApiResult<T>> {
  return NextResponse.json<ApiResult<T>>({ ok: true, data }, { status });
}

/** Convert thrown errors into the standard failure envelope. */
export function fail(error: unknown): NextResponse<ApiResult<never>> {
  if (error instanceof ApiError) {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: error.toJSON() },
      { status: error.status },
    );
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: { code: error.code, message: error.message } },
      { status: 403 },
    );
  }
  const message =
    error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json<ApiResult<never>>(
    { ok: false, error: { code: 'INTERNAL', message } },
    { status: 500 },
  );
}
