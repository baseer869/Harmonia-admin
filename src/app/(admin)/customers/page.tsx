import { PageHeader, ListingCard } from '@/components/layouts';
import { SearchInput, SelectFilter } from '@/components/ui';
import { CustomersTable } from '@/modules/customers';

const STATUS_OPTIONS = [
  { value: '', label: 'Sort by Status' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
];

export default function CustomersPage() {
  return (
    <PageHeader
      title="Users Management"
      description="App users (customer accounts)."
    >
      <ListingCard
        title="App Users Listings"
        filters={
          <>
            <SelectFilter options={STATUS_OPTIONS} defaultValue="" />
            <SearchInput placeholder="Search" className="sm:w-[320px]" />
          </>
        }
      >
        <CustomersTable />
      </ListingCard>
    </PageHeader>
  );
}
