import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  parentId: z.string().nullish(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().optional().or(z.literal('')),
});

export const listCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(100),
  search: z.string().trim().optional(),
  tenantId: z.string().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
