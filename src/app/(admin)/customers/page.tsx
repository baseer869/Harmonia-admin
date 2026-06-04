'use client';

import { PageHeader, ListingCard } from '@/components/layouts';
import { SearchInput, SelectFilter } from '@/components/ui';
import { CustomersTable } from '@/modules/customers';
import { useAdminI18n } from '@/lib/i18n/provider';

export default function CustomersPage() {
  const { t } = useAdminI18n();
  const statusOptions = [
    { value: '', label: t.common.selectStatus },
    { value: 'active', label: t.common.active },
    { value: 'blocked', label: t.lists.blocked },
  ];
  return (
    <PageHeader
      tkey="appUsers"
      title="Users Management"
      description="App users (customer accounts)."
    >
      <ListingCard
        title={t.lists.appUsersListing}
        filters={
          <>
            <SelectFilter options={statusOptions} defaultValue="" />
            <SearchInput placeholder={t.common.search} className="sm:w-[320px]" />
          </>
        }
      >
        <CustomersTable />
      </ListingCard>
    </PageHeader>
  );
}
