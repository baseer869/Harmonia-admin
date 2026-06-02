import type { Actor, Paginated } from '@/types';
import { categoryService } from '../services';
import type { CreateCategoryInput, ListCategoriesQuery } from '../validation';
import type { Category } from '../types';
export const categoryApi = {
  list(actor: Actor, query: ListCategoriesQuery): Promise<Paginated<Category>> {
    return categoryService.list(actor, query);
  },
  create(actor: Actor, input: CreateCategoryInput, targetTenantId?: string): Promise<Category> {
    return categoryService.create(actor, input, targetTenantId);
  },
  remove(actor: Actor, id: string): Promise<void> {
    return categoryService.remove(actor, id);
  },
};
