import { assertCan, resolveTenantContext } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { slugify } from '@/lib/utils';
import type { Actor, Paginated } from '@/types';

import { categoryRepository } from '../repository';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type ListCategoriesQuery,
} from '../validation';
import type { Category } from '../types';

/** Resolve the tenant to act on: explicit > actor's own > sole tenant (super admin). */
async function scopeTenant(actor: Actor, explicit?: string): Promise<string> {
  if (actor.role === 'SUPER_ADMIN') {
    const id = explicit ?? actor.tenantId ?? (await categoryRepository.firstTenantId());
    if (!id) throw ApiError.badRequest('No tenant exists yet. Onboard a tenant first.');
    return id;
  }
  const { tenantId } = resolveTenantContext(actor, explicit ?? actor.tenantId);
  return tenantId;
}

export const categoryService = {
  async list(actor: Actor, query: ListCategoriesQuery): Promise<Paginated<Category>> {
    assertCan(actor, 'read', 'service');
    const { page, pageSize, search, tenantId } = listCategoriesQuerySchema.parse(query);
    const scope = await scopeTenant(actor, tenantId);
    const { items, total } = await categoryRepository.findMany({
      tenantId: scope, skip: (page - 1) * pageSize, take: pageSize, search,
    });
    return { items, total, page, pageSize };
  },

  async create(actor: Actor, input: CreateCategoryInput, targetTenantId?: string): Promise<Category> {
    assertCan(actor, 'create', 'service');
    const scope = await scopeTenant(actor, targetTenantId);
    const data = createCategorySchema.parse(input);
    const slug = slugify(data.name);
    if (await categoryRepository.findBySlug(scope, slug)) {
      throw ApiError.badRequest(`Category "${data.name}" already exists.`);
    }
    return categoryRepository.create(scope, {
      name: data.name,
      slug,
      parentId: data.parentId || null,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
    });
  },

  async update(actor: Actor, id: string, input: UpdateCategoryInput): Promise<Category> {
    assertCan(actor, 'update', 'service');
    const scope = await scopeTenant(actor);
    const data = updateCategorySchema.parse(input);
    const slug = slugify(data.name);
    const clash = await categoryRepository.findBySlug(scope, slug);
    if (clash && clash.id !== id) {
      throw ApiError.badRequest(`Category "${data.name}" already exists.`);
    }
    const updated = await categoryRepository.update(scope, id, {
      name: data.name,
      slug,
      parentId: data.parentId || null,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
    });
    if (!updated) throw ApiError.notFound('Category not found.');
    return updated;
  },

  async remove(actor: Actor, id: string): Promise<void> {
    assertCan(actor, 'delete', 'service');
    const scope = await scopeTenant(actor);
    const ok = await categoryRepository.remove(scope, id);
    if (!ok) throw ApiError.notFound('Category not found.');
  },
};
