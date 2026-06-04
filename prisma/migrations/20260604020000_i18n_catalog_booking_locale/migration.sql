-- Bilingual catalog + booking/customer locale
ALTER TABLE "services" ADD COLUMN "translations" JSONB;
ALTER TABLE "reservations" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE "customers" ADD COLUMN "preferredLocale" TEXT;
