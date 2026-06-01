import { CROSS_TENANT_ROLES, PERMISSIONS, type Action, type Resource } from '@/constants';
import type { Actor, Role } from '@/types';

/** Does `role` have permission to perform `action` on `resource`? */
export function can(role: Role, action: Action, resource: Resource): boolean {
  const grant = PERMISSIONS[role]?.[resource];
  if (!grant) return false;
  if (grant.includes('manage')) return true;
  return (grant as Action[]).includes(action);
}

/** Convenience guard against an Actor. */
export function actorCan(actor: Actor, action: Action, resource: Resource): boolean {
  return can(actor.role, action, resource);
}

/** True for roles that may operate across tenant boundaries (Super Admin). */
export function isCrossTenant(role: Role): boolean {
  return CROSS_TENANT_ROLES.has(role);
}

/** Thrown when an actor lacks a required capability. */
export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** Assert a capability or throw. Use at the top of every Service method. */
export function assertCan(actor: Actor, action: Action, resource: Resource): void {
  if (!actorCan(actor, action, resource)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot ${action} ${resource}.`,
    );
  }
}
