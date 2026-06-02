import { z } from 'zod';
export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  tenantId: z.string().optional(),
});
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
