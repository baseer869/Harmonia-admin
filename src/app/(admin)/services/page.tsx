import Link from 'next/link';
import { Plus } from 'lucide-react';

import { PageHeader, ListingCard } from '@/components/layouts';
import { Button, SearchInput, SelectFilter } from '@/components/ui';
import { ServicesTable } from '@/modules/services';

const STATUS_OPTIONS = [
  { value: '', label: 'Select Status' },
  { value: 'active', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
];

/**
 * Services route — catalog per tenant. Service creation is the onboarding
 * wizard at /services/new.
 */
export default function ServicesPage() {
  return (
    <PageHeader
      title="Services"
      description="The services your business offers. Managed per tenant."
      actions={
        <Button asChild>
          <Link href="/services/new">
            <Plus className="size-4" />
            Add Service
          </Link>
        </Button>
      }
    >
      <ListingCard
        title="Service Listing"
        filters={
          <>
            <SelectFilter options={STATUS_OPTIONS} defaultValue="" />
            <SearchInput placeholder="Search" className="sm:w-[320px]" />
          </>
        }
      >
        <ServicesTable />
      </ListingCard>
    </PageHeader>
  );
}
