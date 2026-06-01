/**
 * Services · domain types (a tenant-OWNED catalog item).
 *
 * Unlike `Tenant` (platform root), every Service carries `tenantId` and is
 * subject to row-level isolation: the repository filters by `tenantId` on
 * EVERY operation.
 */

export interface Service {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
