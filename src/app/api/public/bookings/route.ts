import type { NextRequest } from 'next/server';

import { publicBookingApi } from '@/modules/reservations/server';
import { getCurrentCustomer } from '@/lib/auth';
import { TENANT_SLUG_HEADER } from '@/constants';
import { ApiError, corsPreflight, fail, ok, withCors } from '@/lib/api';

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request.headers.get('origin'));
}

/** Public booking request. Tenant from x-tenant-slug; customer from session or guest contact. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const tenantSlug = request.headers.get(TENANT_SLUG_HEADER);
    if (!tenantSlug) throw ApiError.badRequest('Missing tenant.');

    const body = await request.json();
    const customer = await getCurrentCustomer();
    const result = await publicBookingApi.create(tenantSlug, body, customer);
    return withCors(ok(result, 201), origin);
  } catch (error) {
    return withCors(fail(error), origin);
  }
}
