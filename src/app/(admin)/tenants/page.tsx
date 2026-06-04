import Link from 'next/link';
import { Plus } from 'lucide-react';

import { PageHeader, ListingCard } from '@/components/layouts';
import { Button, SearchInput, SelectFilter } from '@/components/ui';
import { TenantsTable } from '@/modules/tenants';

const STATUS_OPTIONS = [
  { value: '', label: 'Select Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'ARCHIVED', label: 'Archived' },
];

/**
 * Tenants route (Super Admin). Tenant creation is a dedicated onboarding
 * wizard at /tenants/new.
 */
export default function TenantsPage() {
  return (
    <PageHeader
      tkey="tenants"
      title="Tenants"
      description="Create and manage tenant organizations (Super Admin)."
      actions={
        <Button asChild>
          <Link href="/tenants/new">
            <Plus className="size-4" />
            Onboard Tenant
          </Link>
        </Button>
      }
    >
      <ListingCard
        title="Tenant Listing"
        filters={
          <>
            <SelectFilter options={STATUS_OPTIONS} defaultValue="" />
            <SearchInput placeholder="Search" className="sm:w-[320px]" />
          </>
        }
      >
        <TenantsTable />
      </ListingCard>
    </PageHeader>
  );
}
