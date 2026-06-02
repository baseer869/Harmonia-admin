import type { Actor, Paginated } from '@/types';

import { userService } from '../services';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from '../validation';
import type { AdminUser } from '../types';

export const userApi = {
  list(actor: Actor, query: ListUsersQuery): Promise<Paginated<AdminUser>> {
    return userService.list(actor, query);
  },
  create(actor: Actor, input: CreateUserInput): Promise<AdminUser> {
    return userService.create(actor, input);
  },
  update(actor: Actor, id: string, input: UpdateUserInput): Promise<AdminUser> {
    return userService.update(actor, id, input);
  },
};
