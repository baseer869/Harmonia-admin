/**
 * Tenants module · public boundary (client-safe / shared).
 *
 * Exposes types, validation, hooks and components — everything safe to import
 * from client components. The server-only API contract lives in
 * "@/modules/tenants/server" (used by route handlers / Server Components).
 *
 * Internal layers (services, repository) are never re-exported.
 */
export * from './hooks';
export * from './components';
export * from './types';
export * from './validation';
