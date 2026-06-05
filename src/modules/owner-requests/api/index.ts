import type { Actor, Paginated } from '@/types';

import { ownerRequestService, publicOwnerRequestService } from '../services';
import type {
  CreateOwnerRequestInput,
  ListOwnerRequestsQuery,
  UpdateOwnerRequestStatusInput,
} from '../validation';
import type { OwnerRequest } from '../types';

export const ownerRequestApi = {
  list(actor: Actor, query: ListOwnerRequestsQuery): Promise<Paginated<OwnerRequest>> {
    return ownerRequestService.list(actor, query);
  },
  updateStatus(
    actor: Actor,
    id: string,
    input: UpdateOwnerRequestStatusInput,
  ): Promise<OwnerRequest> {
    return ownerRequestService.updateStatus(actor, id, input);
  },
};

/** Public (no auth) — consumed by the client website's contact form. */
export const publicOwnerRequestApi = {
  create(input: CreateOwnerRequestInput): Promise<{ id: string }> {
    return publicOwnerRequestService.create(input);
  },
};
