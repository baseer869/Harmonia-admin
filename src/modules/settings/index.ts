/**
 * Settings module · public boundary.
 *
 * Owns the tenant-facing PROFILE self-service experience. For persistence it
 * composes the tenants module across its public API (`/api/profile` →
 * `tenantApi`), so the settings module itself stays a thin BFF — its
 * repository/services layers are intentionally unused for now.
 *
 * Import this module ONLY via "@/modules/settings".
 */
export * from './hooks';
export * from './components';
export * from './types';
