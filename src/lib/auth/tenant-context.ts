import type { Actor, ID, TenantContext } from '@/types';
import { ForbiddenError, isCrossTenant } from './rbac';

/**
 * Tenant isolation strategy (the single chokepoint).
 *
 * Every Service method derives its `TenantContext` from the current Actor via
 * this helper before touching a repository. The resolved `tenantId` is then
 * passed into repository calls, which ALWAYS filter by it. This guarantees a
 * tenant can never read or mutate another tenant's rows.
 *
 *  - TENANT_ADMIN / TENANT_STAFF: locked to their own `actor.tenantId`. Any
 *    attempt to target a different tenant throws ForbiddenError.
 *  - SUPER_ADMIN (Harmonia): has no home tenant and MUST specify which tenant
 *    to act on (e.g. when managing a tenant's catalog on their behalf). Acting
 *    on a tenant is flagged as `impersonated` for auditing.
 */
export function resolveTenantContext(
  actor: Actor,
  requestedTenantId?: ID | null,
): TenantContext {
  if (isCrossTenant(actor.role)) {
    if (!requestedTenantId) {
      throw new ForbiddenError(
        'Super Admin must specify a target tenant for this operation.',
      );
    }
    return { tenantId: requestedTenantId, impersonated: true };
  }

  // Tenant-scoped roles are pinned to their own tenant.
  if (!actor.tenantId) {
    throw new ForbiddenError('Actor is not associated with a tenant.');
  }
  if (requestedTenantId && requestedTenantId !== actor.tenantId) {
    throw new ForbiddenError('Cross-tenant access is not permitted.');
  }
  return { tenantId: actor.tenantId, impersonated: false };
}
