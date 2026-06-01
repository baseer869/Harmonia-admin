/**
 * Tenants module · SERVER boundary.
 *
 * The server-only public surface (the API contract, which reaches into the
 * service/repository/db layers). Import this from route handlers and Server
 * Components only — never from client components, or server code leaks into the
 * client bundle.
 */
export { tenantApi } from './api';
export type { Tenant, TenantStatus } from './types';
