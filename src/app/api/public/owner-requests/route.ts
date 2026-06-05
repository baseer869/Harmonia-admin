import type { NextRequest } from 'next/server';

import { publicOwnerRequestApi } from '@/modules/owner-requests/server';
import { ApiError, corsPreflight, fail, ok, withCors } from '@/lib/api';

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request.headers.get('origin'));
}

/** Public lead submission from the client website's contact form (no auth). */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json().catch(() => null);
    if (!body) throw ApiError.badRequest('Invalid payload.');
    const result = await publicOwnerRequestApi.create(body);
    return withCors(ok(result, 201), origin);
  } catch (error) {
    return withCors(fail(error), origin);
  }
}
