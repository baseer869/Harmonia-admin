-- Service: currencies accepted for payment (price stays in `currency`)
ALTER TABLE "services" ADD COLUMN "acceptedCurrencies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
