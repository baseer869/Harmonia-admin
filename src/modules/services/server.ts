/**
 * Services module · SERVER boundary.
 *
 * Server-only public surface (the API contract → service → repository → db).
 * Import from route handlers / Server Components only, never from client code.
 */
export { serviceApi, publicServiceApi } from './api';
export type { Service } from './types';
