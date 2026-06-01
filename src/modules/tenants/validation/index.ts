import { z } from 'zod';

/** Tenants · Zod schemas + inferred DTOs (single source of truth for shapes). */

export const tenantStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']);

const slugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated.');

export const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  // Optional: derived from `name` via slugify when omitted.
  slug: slugSchema.optional(),
  status: tenantStatusSchema.default('ACTIVE'),
});

export const updateTenantSchema = z
  .object({
    name: z.string().min(2).max(120),
    slug: slugSchema,
    status: tenantStatusSchema,
  })
  .partial();

/**
 * Tenant-facing profile form (self-service). A Tenant Admin can edit these
 * fields for their OWN tenant; slug/status are NOT editable here (platform
 * concerns). Reused by the `settings` module.
 */
export const tenantProfileSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).nullish(),
  contactEmail: z.string().email().nullish().or(z.literal('')),
  contactPhone: z.string().max(40).nullish().or(z.literal('')),
  logoUrl: z.string().url().nullish().or(z.literal('')),
});

export type TenantProfileInput = z.infer<typeof tenantProfileSchema>;

export const listTenantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type ListTenantsQuery = z.infer<typeof listTenantsQuerySchema>;
