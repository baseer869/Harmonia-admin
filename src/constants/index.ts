/** Barrel for application-wide constants. */
export * from './roles';
export * from './routes';
export * from './currencies';

/** httpOnly session cookie names (custom JWT auth). */
export const SESSION_COOKIE_ADMIN = 'h_admin_session';
export const SESSION_COOKIE_CUSTOMER = 'h_customer_session';

/** Header the client app sends to identify its tenant on /api/public/*. */
export const TENANT_SLUG_HEADER = 'x-tenant-slug';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
