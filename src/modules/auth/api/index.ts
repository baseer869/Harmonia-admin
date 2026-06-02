import { authService } from '../services';
import type {
  AdminLoginInput,
  CustomerLoginInput,
  CustomerRegisterInput,
} from '../validation';
import type { AuthCustomer, AuthUser, SessionResult } from '../types';

/**
 * Auth · API (module public contract). Returns the signed token + principal;
 * the route handler is responsible for setting/clearing the cookie.
 */
export const authApi = {
  adminLogin(input: AdminLoginInput): Promise<SessionResult<AuthUser>> {
    return authService.adminLogin(input);
  },
  customerRegister(
    input: CustomerRegisterInput,
  ): Promise<SessionResult<AuthCustomer>> {
    return authService.customerRegister(input);
  },
  customerLogin(
    input: CustomerLoginInput,
  ): Promise<SessionResult<AuthCustomer>> {
    return authService.customerLogin(input);
  },
};
