import { assertCan } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import type { Actor, Paginated } from '@/types';
import { customerRepository } from '../repository';
import { listCustomersQuerySchema, type ListCustomersQuery } from '../validation';
import type { Customer } from '../types';

export const customerService = {
  async list(actor: Actor, query: ListCustomersQuery): Promise<Paginated<Customer>> {
    assertCan(actor, 'read', 'customer');
    const { page, pageSize, search, tenantId } = listCustomersQuerySchema.parse(query);
    const scope = actor.role === 'SUPER_ADMIN' ? tenantId : (actor.tenantId ?? undefined);
    if (actor.role !== 'SUPER_ADMIN' && !scope) throw ApiError.forbidden('No tenant scope.');
    const { items, total } = await customerRepository.findMany({
      tenantId: scope, skip: (page - 1) * pageSize, take: pageSize, search,
    });
    return { items, total, page, pageSize };
  },

  async setStatus(actor: Actor, id: string, status: 'ACTIVE' | 'BLOCKED'): Promise<Customer> {
    assertCan(actor, 'update', 'customer');
    const scope = actor.role === 'SUPER_ADMIN' ? undefined : (actor.tenantId ?? undefined);
    if (actor.role !== 'SUPER_ADMIN' && !scope) throw ApiError.forbidden('No tenant scope.');
    const updated = await customerRepository.setStatus(scope, id, status);
    if (!updated) throw ApiError.notFound('Customer not found.');
    return updated;
  },
};
