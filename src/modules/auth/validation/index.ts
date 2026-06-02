import { z } from 'zod';

/** Auth · Zod schemas + inferred DTOs. */

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  /** Which tenant the customer belongs to (client app supplies its slug). */
  tenantSlug: z.string().min(1),
});

export const customerRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
  tenantSlug: z.string().min(1),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
