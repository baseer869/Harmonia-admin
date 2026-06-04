-- Peer-locale catalog text: move every localized text column into the
-- `translations` JSON (no canonical language). Existing rows were authored in
-- English via the old English-first wizard, so backfill them under "en".

UPDATE "services" s
SET "translations" = jsonb_build_object(
  'en',
  jsonb_strip_nulls(
    jsonb_build_object(
      'title', s."title",
      'subtitle', s."subtitle",
      'description', s."description",
      'priceUnit', s."priceUnit",
      'tags', CASE
        WHEN array_length(s."tags", 1) IS NULL THEN NULL
        ELSE to_jsonb(s."tags")
      END,
      'included', s."includedJson",
      'info', s."infoJson"
    )
  )
)
WHERE s."translations" IS NULL;

-- Drop the now-redundant text columns; `translations` is the single source.
ALTER TABLE "services"
  DROP COLUMN "title",
  DROP COLUMN "subtitle",
  DROP COLUMN "description",
  DROP COLUMN "priceUnit",
  DROP COLUMN "tags",
  DROP COLUMN "includedJson",
  DROP COLUMN "infoJson";
