'use client';

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
import { useAdminI18n } from '@/lib/i18n/provider';

export default function UsersPage() {
  const { t } = useAdminI18n();
  const statusOptions = [
    { value: '', label: t.common.selectStatus },
    { value: 'active', label: t.common.active },
    { value: 'inactive', label: t.lists.inactive },
  ];
  return (
    <PageHeader
      tkey="admins"
      title="Users Management"
      description="Manage platform and tenant back-office users."
    >
      <Card>
        <CardHeader>
          <CardTitle>{t.lists.addUser}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <ListingCard
        title={t.lists.adminListing}
        filters={
          <>
            <SelectFilter options={statusOptions} defaultValue="" />
            <SearchInput placeholder={t.common.search} className="sm:w-[320px]" />
          </>
        }
      >
        <UsersTable />
      </ListingCard>
    </PageHeader>
  );
}
