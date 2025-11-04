-- Rename currencySymbol to currencyCode on Thing
ALTER TABLE "Thing"
  RENAME COLUMN "currencySymbol" TO "currencyCode";

