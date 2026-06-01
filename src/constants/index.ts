/** Barrel for application-wide constants. */
export * from './roles';
export * from './routes';

/** Tenant resolution headers (set by middleware, read by lib/auth). */
export const TENANT_HEADER = 'x-tenant-id';
export const ACTOR_ID_HEADER = 'x-actor-id';
export const ACTOR_ROLE_HEADER = 'x-actor-role';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
