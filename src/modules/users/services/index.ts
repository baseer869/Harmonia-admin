import { assertCan } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { hashPassword } from '@/lib/auth';
import type { Actor, Paginated } from '@/types';

import { userRepository } from '../repository';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  type CreateUserInput,
  type ListUsersQuery,
  type UpdateUserInput,
} from '../validation';
import type { AdminUser } from '../types';

const isSuper = (a: Actor) => a.role === 'SUPER_ADMIN';

export const userService = {
  async list(actor: Actor, query: ListUsersQuery): Promise<Paginated<AdminUser>> {
    assertCan(actor, 'read', 'user');
    const { page, pageSize, search, tenantId } = listUsersQuerySchema.parse(query);
    // Super Admin sees all (optionally filtered); others see only their tenant.
    const scope = isSuper(actor) ? tenantId : (actor.tenantId ?? undefined);
    if (!isSuper(actor) && !scope) throw ApiError.forbidden('No tenant scope.');

    const { items, total } = await userRepository.findMany({
      tenantId: scope,
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
    });
    return { items, total, page, pageSize };
  },

  async create(actor: Actor, input: CreateUserInput): Promise<AdminUser> {
    assertCan(actor, 'create', 'user');
    const data = createUserSchema.parse(input);

    // Tenant resolution: Super Admin may target any tenant (or null = platform);
    // tenant roles can only create users inside their own tenant.
    let tenantId: string | null;
    if (isSuper(actor)) {
      tenantId = data.tenantId ?? null;
    } else {
      if (!actor.tenantId) throw ApiError.forbidden('No tenant scope.');
      tenantId = actor.tenantId;
      if (data.role === 'SUPER_ADMIN') {
        throw ApiError.forbidden('Cannot grant SUPER_ADMIN.');
      }
    }

    if (await userRepository.findByEmail(data.email)) {
      throw ApiError.badRequest('A user with this email already exists.');
    }

    const passwordHash = await hashPassword(data.password);
    return userRepository.create({
      tenantId,
      email: data.email,
      name: data.name ?? null,
      phone: data.phone ?? null,
      city: data.city ?? null,
      passwordHash,
      role: data.role,
    });
  },

  async update(actor: Actor, id: string, input: UpdateUserInput): Promise<AdminUser> {
    assertCan(actor, 'update', 'user');
    const data = updateUserSchema.parse(input);
    const scope = isSuper(actor) ? undefined : (actor.tenantId ?? undefined);
    if (!isSuper(actor) && !scope) throw ApiError.forbidden('No tenant scope.');

    const updated = await userRepository.update(id, scope, data);
    if (!updated) throw ApiError.notFound('User not found.');
    return updated;
  },
};
