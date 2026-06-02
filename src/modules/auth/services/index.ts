import { ApiError } from '@/lib/api';
import { hashPassword, signSession, verifyPassword } from '@/lib/auth';

import { authRepository } from '../repository';
import {
  adminLoginSchema,
  customerLoginSchema,
  customerRegisterSchema,
  type AdminLoginInput,
  type CustomerLoginInput,
  type CustomerRegisterInput,
} from '../validation';
import type { AuthCustomer, AuthUser, SessionResult } from '../types';

/**
 * Auth · service layer. Verifies credentials and mints a signed session token.
 * Setting the cookie is a transport concern handled by the route handler.
 */
export const authService = {
  // ── Back-office users ──────────────────────────────────────────────────────
  async adminLogin(input: AdminLoginInput): Promise<SessionResult<AuthUser>> {
    const { email, password } = adminLoginSchema.parse(input);

    const user = await authRepository.findUserByEmail(email);
    if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials.');

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Invalid credentials.');

    await authRepository.touchUserLogin(user.id);

    const token = await signSession({
      sub: user.id,
      kind: 'user',
      role: user.role,
      tenantId: user.tenantId,
      email: user.email,
    });

    return {
      token,
      principal: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  },

  // ── Customers (client website) ─────────────────────────────────────────────
  async customerRegister(
    input: CustomerRegisterInput,
  ): Promise<SessionResult<AuthCustomer>> {
    const { email, password, name, tenantSlug } =
      customerRegisterSchema.parse(input);

    const tenant = await authRepository.findTenantBySlug(tenantSlug);
    if (!tenant) throw ApiError.badRequest('Unknown tenant.');

    const existing = await authRepository.findCustomer(tenant.id, email);
    if (existing) throw ApiError.badRequest('An account with this email already exists.');

    const passwordHash = await hashPassword(password);
    const customer = await authRepository.createCustomer({
      tenantId: tenant.id,
      email,
      name: name ?? null,
      passwordHash,
    });

    return this.issueCustomerSession(customer);
  },

  async customerLogin(
    input: CustomerLoginInput,
  ): Promise<SessionResult<AuthCustomer>> {
    const { email, password, tenantSlug } = customerLoginSchema.parse(input);

    const tenant = await authRepository.findTenantBySlug(tenantSlug);
    if (!tenant) throw ApiError.unauthorized('Invalid credentials.');

    const customer = await authRepository.findCustomer(tenant.id, email);
    if (!customer || !customer.passwordHash || customer.status !== 'ACTIVE') {
      throw ApiError.unauthorized('Invalid credentials.');
    }

    const valid = await verifyPassword(password, customer.passwordHash);
    if (!valid) throw ApiError.unauthorized('Invalid credentials.');

    return this.issueCustomerSession(customer);
  },

  async issueCustomerSession(customer: {
    id: string;
    email: string;
    name: string | null;
    tenantId: string;
  }): Promise<SessionResult<AuthCustomer>> {
    const token = await signSession({
      sub: customer.id,
      kind: 'customer',
      tenantId: customer.tenantId,
      email: customer.email,
    });
    return {
      token,
      principal: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        tenantId: customer.tenantId,
      },
    };
  },
};
