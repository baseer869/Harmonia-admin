import type { Role } from '@/types';

/** Auth · domain types (transport-safe principals + session result). */

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  tenantId: string | null;
}

export interface AuthCustomer {
  id: string;
  email: string;
  name: string | null;
  tenantId: string;
}

/** Service-layer result: the signed token + the principal it represents. */
export interface SessionResult<TPrincipal> {
  token: string;
  principal: TPrincipal;
}
