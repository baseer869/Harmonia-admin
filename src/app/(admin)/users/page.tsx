import { PageHeader, ListingCard } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SearchInput,
  SelectFilter,
} from '@/components/ui';
import { CreateUserForm, UsersTable } from '@/modules/users';

const STATUS_OPTIONS = [
  { value: '', label: 'Sort by Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function UsersPage() {
  return (
    <PageHeader
      title="Users Management"
      description="Manage platform and tenant back-office users."
    >
      <Card>
        <CardHeader>
          <CardTitle>Add user</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <ListingCard
        title="Admins Listings"
        filters={
          <>
            <SelectFilter options={STATUS_OPTIONS} defaultValue="" />
            <SearchInput placeholder="Search" className="sm:w-[320px]" />
          </>
        }
      >
        <UsersTable />
      </ListingCard>
    </PageHeader>
  );
}
