-- ==============================================================================
-- NIU: Network for Intelligent Urban Mobility
-- Initial Database Schema Migration
-- ==============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INTERSECTIONS
-- Physical corridor nodes monitored by NIU in Greater Noida
CREATE TABLE IF NOT EXISTS intersections (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(64) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    corridor VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, degraded, maintenance
    approach_directions TEXT[] NOT NULL DEFAULT ARRAY['north', 'south', 'east', 'west'],
    speed_limit_kmh INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TRAFFIC_SNAPSHOTS
-- Temporal telemetry captures of queue lengths, velocity, and congestion states
CREATE TABLE IF NOT EXISTS traffic_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intersection_id VARCHAR(64) NOT NULL REFERENCES intersections(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vehicle_count INTEGER NOT NULL DEFAULT 0,
    average_speed DECIMAL(6, 2) NOT NULL DEFAULT 0.0,
    queue_length INTEGER NOT NULL DEFAULT 0,
    average_wait DECIMAL(6, 2) NOT NULL DEFAULT 0.0,
    congestion_level VARCHAR(32) NOT NULL DEFAULT 'low', -- low, moderate, severe
    simulation_mode VARCHAR(32) NOT NULL DEFAULT 'normal', -- normal, rush_hour, emergency, optimized
    signals_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SIGNAL_TIMINGS
-- Adaptive Webster green-split allocations per intersection
CREATE TABLE IF NOT EXISTS signal_timings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intersection_id VARCHAR(64) NOT NULL REFERENCES intersections(id) ON DELETE CASCADE,
    cycle_length INTEGER NOT NULL DEFAULT 120,
    north_green INTEGER NOT NULL DEFAULT 30,
    south_green INTEGER NOT NULL DEFAULT 30,
    east_green INTEGER NOT NULL DEFAULT 30,
    west_green INTEGER NOT NULL DEFAULT 30,
    north_south_green INTEGER NOT NULL DEFAULT 60,
    east_west_green INTEGER NOT NULL DEFAULT 60,
    pedestrian_time INTEGER NOT NULL DEFAULT 15,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    optimization_method VARCHAR(64) NOT NULL DEFAULT 'webster_minimum_delay',
    waiting_time_reduction_pct DECIMAL(5, 2) DEFAULT 0.0,
    queue_reduction_pct DECIMAL(5, 2) DEFAULT 0.0,
    estimated_co2_saved_kg DECIMAL(8, 3) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TRAFFIC_EVENTS
-- Arterial incidents, density surges, and network notifications
CREATE TABLE IF NOT EXISTS traffic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intersection_id VARCHAR(64) REFERENCES intersections(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL, -- rush_hour_surge, bottleneck_cleared, signal_optimized, sensor_telemetry
    severity VARCHAR(32) NOT NULL DEFAULT 'info', -- info, warning, alert
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EMERGENCY_EVENTS
-- Priority corridor runs for emergency pre-emption (e.g., Ambulance EVP)
CREATE TABLE IF NOT EXISTS emergency_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(64) NOT NULL,
    vehicle_type VARCHAR(64) NOT NULL DEFAULT 'ambulance',
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'idle', -- idle, en_route, completed, cancelled
    route_intersection_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    normal_eta_seconds INTEGER NOT NULL,
    niu_eta_seconds INTEGER NOT NULL,
    time_saved_seconds INTEGER NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CARPOOL_REQUESTS
-- Commuter ride listings and seat requests
CREATE TABLE IF NOT EXISTS carpool_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_identifier VARCHAR(128) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    departure_time VARCHAR(32) NOT NULL,
    seats_required INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, matched, completed, cancelled
    preferred_fuel VARCHAR(32) DEFAULT 'any',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CARPOOL_MATCHES
-- Deterministic spatial-temporal compatibility pairings
CREATE TABLE IF NOT EXISTS carpool_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES carpool_requests(id) ON DELETE CASCADE,
    matched_request_id VARCHAR(128) NOT NULL,
    route_overlap DECIMAL(5, 2) NOT NULL,
    departure_score DECIMAL(5, 2) NOT NULL,
    destination_score DECIMAL(5, 2) NOT NULL,
    detour_penalty DECIMAL(5, 2) NOT NULL,
    total_score DECIMAL(5, 2) NOT NULL,
    co2_saving_kg DECIMAL(8, 3) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'proposed', -- proposed, confirmed, completed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ROUTE_QUERIES
-- Eco-navigation requests contrasting Fastest vs Balanced vs Greenest
CREATE TABLE IF NOT EXISTS route_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    selected_route VARCHAR(64), -- fastest, balanced, greenest
    distance_km DECIMAL(6, 2) NOT NULL,
    duration_minutes DECIMAL(6, 2) NOT NULL,
    co2_kg DECIMAL(8, 3) NOT NULL,
    fuel_liters DECIMAL(6, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. IMPACT_METRICS
-- Periodic environmental and travel delay accounting aggregates
CREATE TABLE IF NOT EXISTS impact_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vehicles_saved INTEGER NOT NULL DEFAULT 0,
    trips_shared INTEGER NOT NULL DEFAULT 0,
    co2_saved DECIMAL(10, 3) NOT NULL DEFAULT 0.0,
    fuel_saved DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    time_saved DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    sustainability_index DECIMAL(5, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. SIMULATION_RUNS
-- Audit log of active simulation scenario changes
CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode VARCHAR(32) NOT NULL, -- normal, rush_hour, emergency, optimized
    triggered_by VARCHAR(64) NOT NULL DEFAULT 'operator_command',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & QUERY ACCELERATION
-- ==============================================================================

-- Traffic Snapshots indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_intersection_id ON traffic_snapshots(intersection_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON traffic_snapshots(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_congestion ON traffic_snapshots(congestion_level);

-- Signal Timings indexes
CREATE INDEX IF NOT EXISTS idx_timings_intersection_id ON signal_timings(intersection_id);
CREATE INDEX IF NOT EXISTS idx_timings_timestamp ON signal_timings(timestamp DESC);

-- Traffic Events indexes
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON traffic_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_resolved ON traffic_events(resolved);
CREATE INDEX IF NOT EXISTS idx_events_intersection ON traffic_events(intersection_id);

-- Emergency Events indexes
CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency_events(status);
CREATE INDEX IF NOT EXISTS idx_emergency_started ON emergency_events(started_at DESC);

-- Carpool Requests & Matches indexes
CREATE INDEX IF NOT EXISTS idx_carpool_origin_dest ON carpool_requests(origin, destination);
CREATE INDEX IF NOT EXISTS idx_carpool_status ON carpool_requests(status);
CREATE INDEX IF NOT EXISTS idx_matches_request_id ON carpool_matches(request_id);

-- Route Queries indexes
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON route_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON route_queries(origin, destination);

-- Impact Metrics index
CREATE INDEX IF NOT EXISTS idx_impact_timestamp ON impact_metrics(timestamp DESC);

-- Simulation Runs index
CREATE INDEX IF NOT EXISTS idx_simulation_started ON simulation_runs(started_at DESC);
