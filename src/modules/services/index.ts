/**
 * Services module · public boundary (client-safe / shared).
 *
 * Types, validation, hooks and components — safe for client components. The
 * server-only API contract lives in "@/modules/services/server".
 * Internal layers (services, repository) are never re-exported.
 */
export * from './hooks';
export * from './components';
export * from './types';
export * from './validation';
