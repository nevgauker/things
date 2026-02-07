-- Enable geospatial helpers (Postgres)
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Geospatial index for faster distance/bounds queries
CREATE INDEX IF NOT EXISTS "Thing_location_earth_idx"
ON "Thing" USING GIST (ll_to_earth("latitude", "longitude"));
