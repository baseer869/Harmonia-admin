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

/**
 * Decide which origin to allow. Reflects the caller's origin when it is the
 * configured client, localhost, or any *.vercel.app deployment — otherwise
 * falls back to CLIENT_ORIGIN. Reflecting (vs a single env value) means the
 * public API keeps working across preview/prod URLs with no env juggling.
 */
function resolveAllowedOrigin(requestOrigin?: string | null): string {
  const fallback = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
  if (!requestOrigin) return fallback;
  try {
    const host = new URL(requestOrigin).host;
    const allowed =
      requestOrigin === fallback ||
      /^localhost(:\d+)?$/.test(host) ||
      host.endsWith('.vercel.app');
    return allowed ? requestOrigin : fallback;
  } catch {
    return fallback;
  }
}

/**
 * CORS for the public API consumed by the separate client origin.
 * Allows credentials so customer-session cookies work cross-origin.
 */
export function withCors<T extends NextResponse>(res: T, requestOrigin?: string | null): T {
  res.headers.set('Access-Control-Allow-Origin', resolveAllowedOrigin(requestOrigin));
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-tenant-slug');
  res.headers.set('Vary', 'Origin');
  return res;
}

/** Standard CORS preflight response. */
export function corsPreflight(requestOrigin?: string | null): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }), requestOrigin);
}
