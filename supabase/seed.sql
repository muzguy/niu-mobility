-- ==============================================================================
-- NIU: Network for Intelligent Urban Mobility
-- Deterministic Seed Data (Greater Noida Corridor Grid)
-- ==============================================================================

-- 1. SEED MONITORED INTERSECTIONS
INSERT INTO intersections (id, name, short_name, description, latitude, longitude, corridor, status, approach_directions, speed_limit_kmh)
VALUES
(
    'pari-chowk',
    'Pari Chowk Major Arterial Interchange',
    'Pari Chowk',
    'Primary regional roundabout connecting Noida-Greater Noida Expressway, Surajpur Main Road, and Knowledge Park institutional corridors. High-volume bottleneck with multi-leg converging traffic.',
    28.4639000,
    77.5108000,
    'Expressway - Surajpur Spine',
    'active',
    ARRAY['north', 'south', 'east', 'west'],
    50
),
(
    'alpha-1',
    'Sector Alpha 1 Commercial Junction',
    'Alpha 1',
    'Four-way junction serving Alpha 1 commercial center and high-density residential blocks. Intersects with internal collector boulevards.',
    28.4722000,
    77.5144000,
    'Alpha Arterial Corridor',
    'active',
    ARRAY['north', 'south', 'east', 'west'],
    45
),
(
    'alpha-2',
    'Sector Alpha 2 Main Crossing',
    'Alpha 2',
    'Major arterial crossing linking Alpha 1 and Alpha 2 residential zones with institutional sectors. Features dual-lane pedestrian crossings and bus stops.',
    28.4760000,
    77.5190000,
    'Alpha Arterial Corridor',
    'active',
    ARRAY['north', 'south', 'east', 'west'],
    45
),
(
    'knowledge-park',
    'Knowledge Park Institutional Corridor Node',
    'Knowledge Park',
    'Heavy student and institutional commute node serving university campuses, research centers, and IT parks. Experiencing intense morning and evening rush-hour peaks.',
    28.4550000,
    77.5020000,
    'Institutional Boulevard',
    'active',
    ARRAY['north', 'south', 'east', 'west'],
    40
),
(
    'jagat-farm',
    'Jagat Farm Central Market Intersection',
    'Jagat Farm',
    'High-density commercial market node with significant pedestrian activity, on-street parking interference, and local transit interchange.',
    28.4700000,
    77.5080000,
    'Central Commercial Spine',
    'active',
    ARRAY['north', 'south', 'east', 'west'],
    35
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = NOW();

-- 2. SEED INITIAL SIGNAL TIMINGS
INSERT INTO signal_timings (
    intersection_id, cycle_length, north_green, south_green, east_green, west_green,
    north_south_green, east_west_green, pedestrian_time, optimization_method,
    waiting_time_reduction_pct, queue_reduction_pct, estimated_co2_saved_kg
)
VALUES
('pari-chowk', 120, 38, 36, 22, 24, 74, 46, 16, 'webster_minimum_delay', 24.5, 31.0, 14.8),
('alpha-1', 120, 32, 30, 28, 30, 62, 58, 14, 'webster_minimum_delay', 18.2, 22.4, 8.6),
('alpha-2', 120, 30, 30, 30, 30, 60, 60, 14, 'webster_minimum_delay', 12.0, 15.0, 5.2),
('knowledge-park', 120, 36, 34, 25, 25, 70, 50, 18, 'webster_minimum_delay', 22.0, 27.5, 12.1),
('jagat-farm', 120, 28, 28, 32, 32, 56, 64, 16, 'webster_minimum_delay', 15.5, 19.0, 7.3);

-- 3. SEED INITIAL TRAFFIC SNAPSHOTS
INSERT INTO traffic_snapshots (
    intersection_id, vehicle_count, average_speed, queue_length, average_wait,
    congestion_level, simulation_mode
)
VALUES
('pari-chowk', 142, 24.5, 68, 3.8, 'severe', 'normal'),
('alpha-1', 86, 34.0, 42, 2.4, 'moderate', 'normal'),
('alpha-2', 58, 42.0, 26, 1.6, 'low', 'normal'),
('knowledge-park', 118, 28.0, 56, 3.2, 'moderate', 'normal'),
('jagat-farm', 94, 21.0, 48, 2.9, 'moderate', 'normal');

-- 4. SEED INITIAL IMPACT METRICS
INSERT INTO impact_metrics (
    vehicles_saved, trips_shared, co2_saved, fuel_saved, time_saved, sustainability_index
)
VALUES
(184, 87, 4.25, 788.0, 48.5, 84.5);

-- 5. SEED INITIAL SIMULATION RUN
INSERT INTO simulation_runs (
    mode, triggered_by, metadata
)
VALUES
('normal', 'initial_system_boot', '{"description": "Deterministic baseline flow initialized for Greater Noida grid"}'::jsonb);
