import { PageHeader, ListingCard } from '@/components/layouts';
import { SearchInput, SelectFilter } from '@/components/ui';
import { ReservationsTable } from '@/modules/reservations';

const STATUS_OPTIONS = [
  { value: '', label: 'Select Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function BookingsPage() {
  return (
    <PageHeader title="Bookings" description="Booking requests and their lifecycle.">
      <ListingCard
        title="Bookings Listing"
        filters={
          <>
            <SelectFilter options={STATUS_OPTIONS} defaultValue="" />
            <SearchInput placeholder="Search" className="sm:w-[320px]" />
          </>
        }
      >
        <ReservationsTable />
      </ListingCard>
    </PageHeader>
  );
}
