/**
 * Auth module · SERVER boundary. The API contract used by route handlers.
 * Import only from route handlers / Server Components.
 */
export { authApi } from './api';
export type { AuthUser, AuthCustomer, SessionResult } from './types';
