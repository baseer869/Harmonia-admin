-- Snapshot the chosen package name so it survives service edits/deletes.
ALTER TABLE "reservation_items" ADD COLUMN "optionName" TEXT;

-- Relax the option FKs to SET NULL so editing a service (which recreates its
-- options) and removing options no longer fails on referenced bookings/carts.
ALTER TABLE "reservation_items" DROP CONSTRAINT IF EXISTS "reservation_items_optionId_fkey";
ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_optionId_fkey"
  FOREIGN KEY ("optionId") REFERENCES "service_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_optionId_fkey";
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_optionId_fkey"
  FOREIGN KEY ("optionId") REFERENCES "service_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
