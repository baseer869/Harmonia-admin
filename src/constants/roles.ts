import type { Role } from '@/types';

/**
 * Role + permission system.
 *
 * Harmonia (the platform owner) operates as SUPER_ADMIN and can manage every
 * tenant AND that tenant's data (catalog, services, reservations…) on their
 * behalf — this matches the initial operating model where Harmonia onboards and
 * runs tenants before they self-serve. TENANT_ADMIN / TENANT_STAFF are always
 * constrained to their own tenant.
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  TENANT_STAFF: 'TENANT_STAFF',
} as const satisfies Record<Role, Role>;

/** Actions a permission can guard. */
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

/** Resources (typically one per module). */
export type Resource =
  | 'tenant'
  | 'user'
  | 'service'
  | 'reservation'
  | 'customer'
  | 'vendor'
  | 'property'
  | 'payment'
  | 'report'
  | 'setting';

/** `manage` is the wildcard that implies every action on a resource. */
type Grant = Partial<Record<Resource, Action[] | ['manage']>>;

/**
 * Capability matrix. The RBAC helper in `lib/auth/rbac.ts` reads this.
 * SUPER_ADMIN gets `manage` on everything (including cross-tenant `tenant`).
 */
export const PERMISSIONS: Record<Role, Grant> = {
  SUPER_ADMIN: {
    tenant: ['manage'],
    user: ['manage'],
    service: ['manage'],
    reservation: ['manage'],
    customer: ['manage'],
    vendor: ['manage'],
    property: ['manage'],
    payment: ['manage'],
    report: ['manage'],
    setting: ['manage'],
  },
  TENANT_ADMIN: {
    // No `tenant` create/delete — only the platform creates tenants.
    tenant: ['read', 'update'],
    user: ['manage'],
    service: ['manage'],
    reservation: ['manage'],
    customer: ['manage'],
    vendor: ['manage'],
    property: ['manage'],
    payment: ['read'],
    report: ['read'],
    setting: ['read', 'update'],
  },
  TENANT_STAFF: {
    service: ['read'],
    reservation: ['create', 'read', 'update'],
    customer: ['create', 'read', 'update'],
    property: ['read'],
  },
};

/** Roles that operate across all tenants. */
export const CROSS_TENANT_ROLES: ReadonlySet<Role> = new Set<Role>([
  ROLES.SUPER_ADMIN,
]);
