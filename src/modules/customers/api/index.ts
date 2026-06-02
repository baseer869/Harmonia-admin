import type { Actor, Paginated } from '@/types';
import { customerService } from '../services';
import type { ListCustomersQuery } from '../validation';
import type { Customer } from '../types';
export const customerApi = {
  list(actor: Actor, query: ListCustomersQuery): Promise<Paginated<Customer>> {
    return customerService.list(actor, query);
  },
  setStatus(actor: Actor, id: string, status: 'ACTIVE' | 'BLOCKED'): Promise<Customer> {
    return customerService.setStatus(actor, id, status);
  },
};
