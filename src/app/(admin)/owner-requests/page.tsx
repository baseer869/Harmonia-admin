'use client';

import { PageHeader } from '@/components/layouts';
import { OwnerRequestsView } from '@/modules/owner-requests';

export default function OwnerRequestsPage() {
  return (
    <PageHeader
      tkey="ownerRequests"
      title="Owner Requests"
      description="Businesses requesting to list their services."
    >
      <OwnerRequestsView />
    </PageHeader>
  );
}
