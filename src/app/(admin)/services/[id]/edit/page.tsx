import { ServiceEditLoader } from '@/modules/services';

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceEditLoader id={id} />;
}
