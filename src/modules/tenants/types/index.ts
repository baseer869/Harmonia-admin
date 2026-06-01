/** Tenants · domain types (the aggregate root of the platform). */

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

/**
 * Tenant aggregate. `slug` is the brandable, routable identifier
 * (subdomain / future custom domain); `id` is the internal `tenantId` used as
 * the isolation discriminator on every other entity.
 *
 * Dates are ISO strings: this is the shape that crosses the module API
 * boundary (serialisable, transport-ready for future backend extraction).
 */
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  // Profile (tenant self-service surface).
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
