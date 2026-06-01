/**
 * Global, cross-cutting types shared by every module.
 * Domain-specific types live inside each module's `types/` folder.
 */

export type ID = string;

/** Roles recognised across the platform. Mirrors Prisma `UserRole`. */
export type Role = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_STAFF';

/**
 * The authenticated principal for the current request.
 * Produced by `lib/auth` from the session/middleware headers and passed
 * down into every Service call so business rules + tenant isolation can be
 * enforced consistently.
 *
 * - SUPER_ADMIN has `tenantId: null` and may act on any tenant.
 * - TENANT_ADMIN / TENANT_STAFF are pinned to their own `tenantId`.
 */
export interface Actor {
  id: ID;
  role: Role;
  tenantId: ID | null;
  email?: string;
}

/** Resolved tenant scope for a unit of work. */
export interface TenantContext {
  /** The tenant a query should be constrained to. */
  tenantId: ID;
  /** True when a SUPER_ADMIN is acting on a tenant other than their own. */
  impersonated: boolean;
}

/** Standard envelope returned by the API/route layer. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorShape };

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
}

/** Pagination request + response primitives. */
export interface PageQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
