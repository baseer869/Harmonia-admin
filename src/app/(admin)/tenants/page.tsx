'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { PageHeader, ListingCard } from '@/components/layouts';
import { Button, SearchInput, SelectFilter } from '@/components/ui';
import { TenantsTable } from '@/modules/tenants';
import { useAdminI18n } from '@/lib/i18n/provider';

/**
 * Tenants route (Super Admin). Tenant creation is a dedicated onboarding
 * wizard at /tenants/new.
 */
export default function TenantsPage() {
  const { t } = useAdminI18n();
  const statusOptions = [
    { value: '', label: t.common.selectStatus },
    { value: 'ACTIVE', label: t.common.active },
    { value: 'SUSPENDED', label: t.lists.suspended },
    { value: 'ARCHIVED', label: t.lists.archived },
  ];
  return (
    <PageHeader
      tkey="tenants"
      title="Tenants"
      description="Create and manage tenant organizations (Super Admin)."
      actions={
        <Button asChild>
          <Link href="/tenants/new">
            <Plus className="size-4" />
            {t.lists.addTenant}
          </Link>
        </Button>
      }
    >
      <ListingCard
        title={t.lists.tenantListing}
        filters={
          <>
            <SelectFilter options={statusOptions} defaultValue="" />
            <SearchInput placeholder={t.common.search} className="sm:w-[320px]" />
          </>
        }
      >
        <TenantsTable />
      </ListingCard>
    </PageHeader>
  );
}
