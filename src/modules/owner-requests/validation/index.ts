import { z } from 'zod';

export const ownerRequestStatusSchema = z.enum([
  'NEW',
  'REVIEWING',
  'APPROVED',
  'REJECTED',
  'CONVERTED',
]);

export const listOwnerRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: ownerRequestStatusSchema.optional(),
  search: z.string().trim().min(1).optional(),
});
export type ListOwnerRequestsQuery = z.infer<typeof listOwnerRequestsQuerySchema>;

/** Public form payload — submitted by the client website (no auth). */
export const createOwnerRequestSchema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(120),
  lastName: z.string().trim().max(120).optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  role: z.string().trim().max(120).optional(),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().max(4000).optional(),
  locale: z.string().max(5).optional(),
});
export type CreateOwnerRequestInput = z.infer<typeof createOwnerRequestSchema>;

export const updateOwnerRequestStatusSchema = z.object({
  status: ownerRequestStatusSchema,
});
export type UpdateOwnerRequestStatusInput = z.infer<typeof updateOwnerRequestStatusSchema>;
