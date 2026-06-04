import { PageHeader, ListingCard } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, SearchInput } from '@/components/ui';
import { CategoriesTable, CreateCategoryForm } from '@/modules/categories';

export default function CategoriesPage() {
  return (
    <PageHeader tkey="categories" title="Categories" description="Organize your services (up to two levels).">
      <Card>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCategoryForm />
        </CardContent>
      </Card>
      <ListingCard
        title="Categories Listing"
        filters={<SearchInput placeholder="Search" className="sm:w-[320px]" />}
      >
        <CategoriesTable />
      </ListingCard>
    </PageHeader>
  );
}
