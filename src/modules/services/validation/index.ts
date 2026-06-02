import { z } from 'zod';

/** Services · Zod schemas + inferred DTOs. `tenantId` is NEVER part of input —
 *  it is derived from the tenant context, never trusted from the client. */

const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated.');

export const serviceTypeSchema = z.enum([
  'EXPERIENCE',
  'TRANSFER',
  'PRODUCT',
  'QUOTE',
]);
export const priceModeSchema = z.enum([
  'PER_PERSON',
  'PER_TRIP',
  'FIXED',
  'ON_QUOTE',
]);

export const serviceOptionSchema = z.object({
  name: z.string().min(1),
  priceDeltaCents: z.coerce.number().int().default(0),
});
export const serviceExtraSchema = z.object({
  name: z.string().min(1),
  priceCents: z.coerce.number().int().min(0).default(0),
});
export const serviceIncludedSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
});
export const serviceInfoSchema = z.object({
  label: z.string().min(1),
  value: z.string().default(''),
});

export const createServiceSchema = z.object({
  categoryId: z.string().nullish(),
  type: serviceTypeSchema.default('EXPERIENCE'),
  title: z.string().min(2).max(160),
  subtitle: z.string().max(200).optional(),
  slug: slugSchema.optional(),
  description: z.string().max(4000).nullish(),
  tags: z.array(z.string()).default([]),

  coverUrl: z.string().optional().or(z.literal('')),
  thumbUrl: z.string().optional().or(z.literal('')),

  priceMode: priceModeSchema.default('PER_PERSON'),
  priceCents: z.coerce.number().int().min(0).default(0),
  currency: z.string().length(3).default('MAD'),
  priceUnit: z.string().max(40).optional(),
  requiresDate: z.boolean().default(true),
  minPeople: z.coerce.number().int().min(1).optional(),
  maxPeople: z.coerce.number().int().min(1).optional(),
  durationMinutes: z.coerce.number().int().min(0).optional(),
  languages: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),

  options: z.array(serviceOptionSchema).default([]),
  extras: z.array(serviceExtraSchema).default([]),
  included: z.array(serviceIncludedSchema).default([]),
  info: z.array(serviceInfoSchema).default([]),
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
export type ServiceType = z.infer<typeof serviceTypeSchema>;
export type PriceMode = z.infer<typeof priceModeSchema>;
