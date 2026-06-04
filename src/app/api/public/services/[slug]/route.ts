import type { NextRequest } from 'next/server';

import { publicServiceApi } from '@/modules/services/server';
import { TENANT_SLUG_HEADER } from '@/constants';
import { ApiError, corsPreflight, fail, ok, withCors } from '@/lib/api';

type Context = { params: Promise<{ slug: string }> };

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request.headers.get('origin'));
}

/** Public service detail by slug. */
export async function GET(request: NextRequest, { params }: Context) {
  const origin = request.headers.get('origin');
  try {
    const tenantSlug =
      request.headers.get(TENANT_SLUG_HEADER) ?? request.nextUrl.searchParams.get('tenant');
    if (!tenantSlug) throw ApiError.badRequest('Missing tenant.');
    const { slug } = await params;
    const locale = request.nextUrl.searchParams.get('locale') ?? undefined;
    return withCors(ok(await publicServiceApi.getBySlug(tenantSlug, slug, locale)), origin);
  } catch (error) {
    return withCors(fail(error), origin);
  }
}
