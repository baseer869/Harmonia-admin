import { PageHeader } from '@/components/layouts';
import { BookingsView } from '@/modules/reservations';

export default function BookingsPage() {
  return (
    <PageHeader title="Bookings" description="Booking requests and their lifecycle.">
      <BookingsView />
    </PageHeader>
  );
}
