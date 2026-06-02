import type { Role } from '@/types';

/** Users · domain types (back-office principals). */
export interface AdminUser {
  id: string;
  tenantId: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
