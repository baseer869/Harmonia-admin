/** Categories · domain types (2-level catalog tree). */
export interface Category {
  id: string;
  tenantId: string;
  parentId: string | null;
  parentName: string | null;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
}
