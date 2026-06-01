import { z } from 'zod';

/** Services · Zod schemas + inferred DTOs. `tenantId` is NEVER part of input —
 *  it is derived from the tenant context, never trusted from the client. */

const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated.');

export const createServiceSchema = z.object({
  title: z.string().min(2).max(160),
  slug: slugSchema.optional(),
  description: z.string().max(4000).nullish(),
  priceCents: z.coerce.number().int().min(0).default(0),
  currency: z.string().length(3).default('MAD'),
  active: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const listServicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  /** Super Admin only: which tenant's catalog to act on. */
  tenantId: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
