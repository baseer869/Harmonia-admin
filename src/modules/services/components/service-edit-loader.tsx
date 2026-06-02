'use client';

import { useService } from '../hooks';
import { ServiceOnboarding } from './service-onboarding';

/** Fetches a service by id (client) then renders the wizard in edit mode. */
export function ServiceEditLoader({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useService(id);

  if (isLoading) {
    return <p className="text-muted-foreground p-6 text-sm">Loading service…</p>;
  }
  if (isError || !data) {
    return (
      <p className="text-destructive p-6 text-sm">
        {(error as Error | null)?.message ?? 'Service not found.'}
      </p>
    );
  }

  return <ServiceOnboarding service={data} />;
}
