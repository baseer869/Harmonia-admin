import type { ApiResult } from '@/types';
import { ApiError } from './errors';

/**
 * Thin fetch wrapper used by client-side module hooks to call the app's route
 * handlers. When the backend is later extracted, only `baseUrl` changes — the
 * module hook/API contract stays identical.
 */
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as ApiResult<T> | null;

  if (!res.ok || !body || body.ok === false) {
    const err = body && body.ok === false ? body.error : undefined;
    throw new ApiError(
      err?.code ?? 'REQUEST_FAILED',
      err?.message ?? res.statusText,
      res.status,
      err?.details,
    );
  }

  return body.data;
}

export const http = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
