import { ApiError } from '@/lib/api';
import type { Actor, Paginated } from '@/types';

import { ownerRequestRepository } from '../repository';
import {
  createOwnerRequestSchema,
  listOwnerRequestsQuerySchema,
  updateOwnerRequestStatusSchema,
  type CreateOwnerRequestInput,
  type ListOwnerRequestsQuery,
  type UpdateOwnerRequestStatusInput,
} from '../validation';
import type { OwnerRequest } from '../types';

/** Owner requests are platform-level leads — visible to admins, not staff. */
function assertAdmin(actor: Actor) {
  if (actor.role === 'TENANT_STAFF') throw ApiError.forbidden('Not allowed.');
}

export const ownerRequestService = {
  async list(actor: Actor, query: ListOwnerRequestsQuery): Promise<Paginated<OwnerRequest>> {
    assertAdmin(actor);
    const { page, pageSize, status, search } = listOwnerRequestsQuerySchema.parse(query);
    const { items, total } = await ownerRequestRepository.findMany({
      status,
      search,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  },

  async updateStatus(
    actor: Actor,
    id: string,
    input: UpdateOwnerRequestStatusInput,
  ): Promise<OwnerRequest> {
    assertAdmin(actor);
    const { status } = updateOwnerRequestStatusSchema.parse(input);
    const updated = await ownerRequestRepository.updateStatus(id, status);
    if (!updated) throw ApiError.notFound('Request not found.');
    return updated;
  },
};

/** Public submission from the client website (no auth). */
export const publicOwnerRequestService = {
  async create(input: CreateOwnerRequestInput): Promise<{ id: string }> {
    const data = createOwnerRequestSchema.parse(input);
    const created = await ownerRequestRepository.create(data);
    return { id: created.id };
  },
};
