'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { PageHeader, ListingCard } from '@/components/layouts';
import { Button, SearchInput, SelectFilter } from '@/components/ui';
import { ServicesTable } from '@/modules/services';
import { useAdminI18n } from '@/lib/i18n/provider';

/**
 * Services route — catalog per tenant. Service creation is the onboarding
 * wizard at /services/new.
 */
export default function ServicesPage() {
  const { t } = useAdminI18n();
  const statusOptions = [
    { value: '', label: t.common.selectStatus },
    { value: 'active', label: t.common.active },
    { value: 'hidden', label: t.common.hidden },
  ];
  return (
    <PageHeader
      tkey="services"
      title="Services"
      description="The services your business offers. Managed per tenant."
      actions={
        <Button asChild>
          <Link href="/services/new">
            <Plus className="size-4" />
            {t.services.addService}
          </Link>
        </Button>
      }
    >
      <ListingCard
        title={t.services.listing}
        filters={
          <>
            <SelectFilter options={statusOptions} defaultValue="" />
            <SearchInput placeholder={t.common.search} className="sm:w-[320px]" />
          </>
        }
      >
        <ServicesTable />
      </ListingCard>
    </PageHeader>
  );
}
