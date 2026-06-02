import { z } from 'zod';

export const userRoleSchema = z.enum([
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'TENANT_STAFF',
]);

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  password: z.string().min(8),
  role: userRoleSchema.default('TENANT_STAFF'),
  /** Super Admin only: which tenant the user belongs to (null = platform). */
  tenantId: z.string().nullish(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(120),
    role: userRoleSchema,
    isActive: z.boolean(),
  })
  .partial();

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  tenantId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
