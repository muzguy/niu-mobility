-- =====================================================================
-- NIU (Network for Intelligent Urban Mobility)
-- Migration 02: Geospatial Mobility Zones & Road Networks
-- =====================================================================

-- 1. Mobility Zones Table
CREATE TABLE IF NOT EXISTS mobility_zones (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  display_name TEXT,
  latitude DECIMAL(9, 6) NOT NULL,
  longitude DECIMAL(9, 6) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 1200,
  source VARCHAR(32) NOT NULL DEFAULT 'osm' CHECK (source IN ('osm', 'seed', 'geocoded')),
  data_availability JSONB NOT NULL DEFAULT '{"roadNetwork":"real","traffic":"simulated","liveSensors":"unavailable"}'::jsonb,
  provenance JSONB NOT NULL DEFAULT '{"source":"simulation"}'::jsonb,
  poi_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Road Networks Table
CREATE TABLE IF NOT EXISTS road_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id VARCHAR(64) NOT NULL REFERENCES mobility_zones(id) ON DELETE CASCADE,
  roads JSONB NOT NULL DEFAULT '[]'::jsonb,
  intersections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_road_networks_zone UNIQUE(zone_id)
);

-- Indexes for spatial querying and fast lookups
CREATE INDEX IF NOT EXISTS idx_mobility_zones_coords ON mobility_zones (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_mobility_zones_created ON mobility_zones (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_road_networks_zone ON road_networks (zone_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_mobility_zones_modtime
  BEFORE UPDATE ON mobility_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_road_networks_modtime
  BEFORE UPDATE ON road_networks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
