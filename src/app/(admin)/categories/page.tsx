'use client';

import { PageHeader, ListingCard } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, SearchInput } from '@/components/ui';
import { CategoriesTable, CreateCategoryForm } from '@/modules/categories';
import { useAdminI18n } from '@/lib/i18n/provider';

export default function CategoriesPage() {
  const { t } = useAdminI18n();
  return (
    <PageHeader tkey="categories" title="Categories" description="Organize your services (up to two levels).">
      <Card>
        <CardHeader>
          <CardTitle>{t.lists.addCategory}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCategoryForm />
        </CardContent>
      </Card>
      <ListingCard
        title={t.lists.categoriesListing}
        filters={<SearchInput placeholder={t.common.search} className="sm:w-[320px]" />}
      >
        <CategoriesTable />
      </ListingCard>
    </PageHeader>
  );
}
