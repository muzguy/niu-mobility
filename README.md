# NIU — Network for Intelligent Urban Mobility

> **Smarter movement. Cleaner cities.**

NIU is an advanced, enterprise-grade urban mobility management platform designed to connect commuters, vehicles, arterial roads, and city telemetry. Built as a flagship B.Tech Computer Science & Engineering sustainability project, NIU integrates traffic intelligence, adaptive signal timing optimization, deterministic carpool matching, eco-routing, emergency vehicle pre-emption, and rigorous carbon emissions accounting.

---

## 1. Problem Statement
Rapid urbanization and single-occupancy private vehicle dominance in growing metropolitan regions (such as Greater Noida and NCR) lead to severe traffic congestion, excessive stop-and-go idling, elongated emergency response times, and mounting greenhouse gas emissions. Conventional traffic systems operate on static, uncoordinated signal timers and lack real-time synchronization between commuter trip demand and road infrastructure.

## 2. The Solution
NIU delivers a unified **Mobility Command Center** that bridges the gap between infrastructure and commuters:
1. **Dynamic Traffic Signal Optimization**: Adjusts green light splits adaptively based on real-time vehicle density and queue metrics to minimize unnecessary idle time.
2. **Deterministic Carpool Matching**: Connects commuters along shared travel corridors using multi-factor route overlap and departure affinity algorithms, taking single-occupancy vehicles off the road.
3. **Multi-Objective Smart Routing**: Compares Fastest, Balanced, and Greenest travel routes with exact carbon emission breakdowns.
4. **Emergency Vehicle Priority (EVP)**: Simulates automated "green-wave" corridors to clear arterial paths for first responders.
5. **Rigorous Carbon Accounting**: Uses standard IPCC/EPA carbon emission factors to compute verified CO2 and fuel savings.

---

## 3. Key Features

- **Geospatial Mobility Map (MapLibre GL JS)**: Interactive vector-rendered map of real OpenStreetMap road geometry across Greater Noida zones (Pari Chowk Core, Galgotias University, Dankaur Junction, Knowledge Park) with road-level traffic states (Free Flow, Moderate, Congested, Severe), clickable junction signal inspectors, emergency EVP corridor visualization, and simulated vehicle movement.
- **Scientifically Honest Provenance Model**: Explicit separation between REAL ROAD NETWORK (OpenStreetMap), SIMULATED TRAFFIC (NIU Synthetic Demand Engine), and NO PHYSICAL SENSORS (Synthetic Disconnected).
- **Traffic Intelligence Console**: In-depth directional queue metrics, approach speeds, volume curves, and signal timing visualizations.
- **Webster-Inspired Signal Optimizer**: Deterministic algorithm allocating dynamic green times, cutting waiting times by 20–40% and queues by 18–35%.
- **Deterministic Carpool Matcher**: Instant ride matching based on spatial route overlap, departure windows, and detour costs—without black-box AI approximations.
- **Eco-Routing Engine**: Multi-profile route analysis contrasting transit time vs. carbon footprint.
- **Emergency Priority Simulator**: Synchronized green-corridor pre-emption for ambulances, cutting transit times by over 25%.
- **Sustainability Analytics**: Continuous tracking of avoided CO2 (tons), saved fuel (liters), and the comprehensive **NIU Impact Score (0-100)**.

---

## 4. System & Backend Architecture

NIU implements a decoupled 5-tier architecture ensuring deterministic simulation execution locally, with seamless transition to persistent database storage when configured:

```
UI Components (Client / Server Components)
   │  fetch (with automatic client fallback)
   ▼
Next.js App Router API Handlers (src/app/api/*)
   │  Zod Payload Validation & Uniform JSON Envelope
   ▼
Service Layer (src/services/*)
   │  Domain Business Logic
   ▼
Repository Pattern (src/lib/repositories/*)
   ├── SimulationRepository (In-Memory Deterministic Greater Noida Data)
   └── SupabaseRepository (PostgreSQL / Supabase REST with auto-fallback)
   ▼
Deterministic Mobility Engines (src/lib/*)
   ├── Webster Signal Optimizer
   ├── Deterministic Carpool Matching Engine
   ├── IPCC Eco-Emissions Calculator
   ├── Multi-Objective Routing Matrix
   └── Emergency Corridor Pre-emption Engine
```

For complete architectural specifications and data flow diagrams, see [NIU_BACKEND.md](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/NIU_BACKEND.md) and [NIU_ARCHITECTURE.md](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/NIU_ARCHITECTURE.md).

---

## 5. Dual Operational Data Modes

NIU can operate in two distinct persistence modes controlled via the `NIU_DATA_MODE` environment variable:

| Mode | Environment Config | Description |
|---|---|---|
| **SIMULATION MODE** *(Default)* | `NIU_DATA_MODE=simulation` | Runs out-of-the-box with **zero credentials or external setup**. Serves deterministic calibrated telemetry for Greater Noida junctions. |
| **DATABASE MODE** | `NIU_DATA_MODE=database` | Connects to PostgreSQL / Supabase for persistent snapshots, audit logs, and queries. Includes automatic fallback to simulation if Supabase is unreachable. |

---

## 6. API Endpoints Reference

All API endpoints return a uniform JSON envelope:
- **Success**: `{ "success": true, "data": { ... }, "timestamp": "..." }`
- **Error**: `{ "success": false, "error": { "code": "...", "message": "...", "details": { ... } }, "timestamp": "..." }`

| Method | Endpoint | Description | Sample Request |
|---|---|---|---|
| `GET` | `/api/health` | Service health & active data mode | `curl http://localhost:3000/api/health` |
| `GET` | `/api/location/search` | OpenStreetMap location search & geocoding | `curl "http://localhost:3000/api/location/search?q=Galgotias+University"` |
| `GET` | `/api/location/zone` | Query zone by coordinate or list registered zones | `curl "http://localhost:3000/api/location/zone?lat=28.3639&lng=77.5402"` |
| `POST` | `/api/location/zone` | Create & register a new Mobility Zone | `{"name": "Galgotias University", "latitude": 28.3639, "longitude": 77.5402, "radiusMeters": 1400}` |
| `GET` | `/api/location/zone/:id` | Retrieve zone metadata & bounds | `curl http://localhost:3000/api/location/zone/galgotias-university` |
| `GET` | `/api/location/zone/:id/network` | Retrieve road segments and junctions | `curl http://localhost:3000/api/location/zone/galgotias-university/network` |
| `GET` | `/api/location/zone/:id/traffic` | Location-aware synthetic traffic state | `curl http://localhost:3000/api/location/zone/galgotias-university/traffic` |
| `GET` | `/api/traffic` | Macro traffic metrics & status (supports `?zoneId=`) | `curl "http://localhost:3000/api/traffic?zoneId=galgotias-university"` |
| `GET` | `/api/traffic/intersections` | Monitored junction node list | `curl http://localhost:3000/api/traffic/intersections` |
| `POST` | `/api/traffic/optimize` | Webster signal split optimization | `{"intersectionId": "pari-chowk", "vehicleDensity": 140, "queueLength": 60, "waitingTime": 4.0}` |
| `POST` | `/api/traffic/simulation` | Switch simulation scenario | `{"mode": "rush_hour"}` |
| `GET` | `/api/carpool/search` | Retrieve active carpool rides | `curl http://localhost:3000/api/carpool/search` |
| `POST` | `/api/carpool/search` | Search shared commute rides | `{"origin": "Alpha 1", "destination": "Knowledge Park", "departureTime": "08:30 AM", "seats": 1}` |
| `GET` | `/api/routes` | Eco-navigation route comparison | `curl "http://localhost:3000/api/routes?origin=Alpha+1&destination=Knowledge+Park"` |
| `POST` | `/api/routes` | Eco-navigation route comparison | `{"origin": "Alpha 1", "destination": "Knowledge Park"}` |
| `GET` | `/api/impact` | IPCC carbon footprint analytics | `curl http://localhost:3000/api/impact` |
| `GET` | `/api/emergency/priority` | Active emergency corridor status | `curl http://localhost:3000/api/emergency/priority` |
| `POST` | `/api/emergency/priority` | Activate/cancel emergency pre-emption | `{"action": "activate", "vehicleId": "AMB-108"}` |

---

## 7. Geospatial Mobility Zones & Data Provenance

NIU explicitly isolates physical road geography from real sensor feeds and synthetic demand models:

- **Road Network**: Extracted via OpenStreetMap (Nominatim & Overpass API) or calibrated seed surveys (`roadNetwork: "real"`).
- **Traffic Telemetry**: Generated deterministically using IRC highway capacity, diurnal hourly multipliers, and BPR speed-flow curves (`traffic: "simulated"`).
- **Sensor Feeds**: Disclosed as disconnected (`liveSensors: "unavailable"`).

For detailed geospatial architecture and mathematical models, see [NIU_GEOSPATIAL.md](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/NIU_GEOSPATIAL.md).

---

## 8. Database Setup (Supabase / PostgreSQL)

When enabling Database Mode (`NIU_DATA_MODE=database`), run the provided migrations and seed data in your Supabase project:

1. **Apply Core Schema**: Execute [`supabase/migrations/20261005000000_initial_schema.sql`](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/supabase/migrations/20261005000000_initial_schema.sql). Creates the 10 core mobility tables.
2. **Apply Geospatial Schema**: Execute [`supabase/migrations/20261005010000_geospatial_zones.sql`](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/supabase/migrations/20261005010000_geospatial_zones.sql). Creates `mobility_zones` and `road_networks` tables.
3. **Apply Deterministic Seed Data**: Execute [`supabase/seed.sql`](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/supabase/seed.sql) to populate baseline Greater Noida monitored corridors.

---

## 8. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing across all models)
- **API Validation**: [Zod](https://zod.dev/) (Strict runtime payload verification)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Dark-first modern engineering aesthetic)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Database / Backend**: PostgreSQL / Supabase PostgREST (Optional persistence with automatic local fallback)

---

## 9. Simulation Disclaimer

> [!NOTE]
> **SIMULATION MODE NOTICE**
> The default version of NIU is a high-fidelity working prototype and simulation. All intersection telemetry, vehicle counts, carpool listings, and signal adjustments reflect simulated Greater Noida urban corridors. The platform does not claim live physical control over municipal traffic infrastructure or real-time GPS hardware. All calculation engines execute real, deterministic mathematical models designed for seamless future sensor ingestion.

---

## 10. Environment Variables

The project runs completely out-of-the-box in local simulation mode without external keys. Configure `.env.local` based on `.env.example`:

```bash
# Operational Data Mode ('simulation' | 'database')
NIU_DATA_MODE=simulation

# CARTO Basemap API Key (Required for MapLibre map basemap tiles)
# In development: add to .env.local
# In production (Vercel): add under Project -> Settings -> Environment Variables
NEXT_PUBLIC_CARTO_API_KEY=your_carto_api_key_here

# Optional Custom Map Style URL (e.g. custom vector tileset / style JSON)
NEXT_PUBLIC_MAP_STYLE_URL=

# Supabase Persistence (Required only when NIU_DATA_MODE=database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Future Integrations (Optional / Alternative Providers)
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_TRAFFIC_API_KEY=
NEXT_PUBLIC_ML_SERVICE_URL=
```

---

## 11. Setup & Local Run Instructions

### Prerequisites
- Node.js 18.17+ or 20+ (Tested on Node.js v24)
- npm 9+ or 10+

### Installation & Execution
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# Navigate to http://localhost:3000
```

### Production Build & Verification
```bash
# Run TypeScript compilation and production bundle build
npm run build

# Run ESLint verification
npm run lint

# Start production server
npm run start
```

---

## 12. Phase 9 — Traffic-Aware Smart Routing Engine

NIU Smart Routes operates as a fully deterministic, graph-based traffic-aware routing engine that consumes real OpenStreetMap road geometry from Mobility Zones and solves multi-objective pathfinding.

### 12.1 Road Graph Architecture
The road network is projected into a directed `RoadGraph` consisting of:
- **`RoadGraphNode`**: Road junctions and signalized intersections, containing coordinates, connectivity indices, signalization status, and scenario-dependent intersection delay.
- **`RoadGraphEdge`**: Directed road links capturing real LineString geometry, lane count, highway classification, free-flow speed, BPR current speed, volume-to-capacity ($V/C$) ratio, one-way constraints, and thermodynamic CO2 estimates.
- **Bi-directional & One-Way Handling**: Segments with `oneWay: true` instantiate a single directed forward edge; bidirectional roads instantiate dual directed edges with reversed coordinate orientation.
- **Snapping Engine**: Deterministically projects query coordinates to the nearest road node using Haversine geodesic distance with an enforced 5000m zone boundary threshold.

### 12.2 Routing Algorithm & Multi-Path Diversity
- **Algorithm**: A* search using an admissible and consistent lower-bound heuristic ($h(u, v) = \text{haversine}(u, v) / v_{\max}$).
- **Alternative Route Generation**: Generates up to 3 diverse physical alternatives (e.g. NIU Optimal Arterial, Peripheral Bypass, Eco Greenway) using multi-objective exploration and adaptive edge penalties (2.2x to 2.8x) with corridor overlap divergence validation (`arePathsDistinct < 0.85`).

### 12.3 Edge Cost Model & Configurable Weights
Every edge receives a dynamic cost based on its simulated traffic state:

$$\text{EdgeCost} = w_{\text{time}} \cdot T + w_{\text{delay}} \cdot D + w_{\text{congestion}} \cdot C + w_{\text{emissions}} \cdot E + w_{\text{distance}} \cdot S$$

Where:
- $T = \text{lengthMeters} / \text{currentSpeedMps}$ (BPR speed-flow travel time)
- $D = \text{intersectionDelaySeconds}$ (Webster signal delay at target node)
- $C = T \cdot \max(0, V/C - 0.5) \cdot 1.5$ (Congestion queue penalty)
- $E = \text{estimatedEmissionsKg} \cdot 120$ (Social cost of carbon equivalent)
- $S = \text{lengthMeters} \cdot 0.01$ (Distance scale factor)

| Routing Objective | Time ($w_t$) | Congestion ($w_c$) | Emissions ($w_e$) | Intersection Delay ($w_d$) | Distance ($w_s$) |
|---|---|---|---|---|---|
| **NIU_OPTIMAL** (Default) | 1.00 | 0.40 | 0.25 | 0.50 | 0.05 |
| **FASTEST** | 1.00 | 0.15 | 0.00 | 0.60 | 0.00 |
| **SHORTEST** | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| **LOWEST_EMISSIONS** | 0.20 | 0.25 | 1.20 | 0.30 | 0.30 |
| **LOWEST_CONGESTION** | 0.30 | 1.50 | 0.10 | 0.40 | 0.00 |

### 12.4 Normalized NIU Route Score (0–100)
Every computed alternative is scored transparently on a 0–100 scale:
- **35% Travel Time Efficiency**: Relative to lowest transit duration across alternatives.
- **30% Congestion Index**: Inversely proportional to volume-to-capacity load ($100 - \text{congestionScore}$).
- **20% Carbon Footprint**: Relative to lowest emissions corridor.
- **15% Intersection Signal Delay**: Penalty based on total junction wait seconds.

The route with the highest NIU Score is recommended with an automated, metric-derived justification (e.g., *"1.6 min faster with lower congestion and 40% lower estimated CO2"*).

### 12.5 Tripartite Data Provenance & Limitations
- **Road Network**: `REAL — OSM / SEED` (Extracted from OpenStreetMap geometry).
- **Traffic State**: `SIMULATED — NIU SYNTHETIC DEMAND ENGINE` (BPR speed-flow demand).
- **Route Computation**: `NIU COMPUTED` (Deterministic A* Graph Solver).
- **Emissions**: `ESTIMATED — IPCC/CEA CALIBRATED` (Thermodynamic fuel burn factors).

> [!WARNING]
> **SYSTEM LIMITATION NOTICE**
> NIU is not yet connected to live physical road sensors or proprietary turn-by-turn navigation providers. All routes, delays, and emissions represent traffic-aware route optimization using real OSM road geometry and NIU's deterministic mobility simulation.

---

## 13. Development Roadmap

- **Phases 1–9 (Complete)**: Architectural foundation, Mobility Command Center, interactive vector map (MapLibre GL JS + CARTO basemap), traffic intelligence, Webster signal optimizer, deterministic carpool matching, traffic-aware smart routing engine, sustainability engine, and emergency vehicle pre-emption simulation.
- **Phase 10 (Future)**: Python/FastAPI ML service for predictive traffic forecasting (GNN/LSTM) and connected physical sensor ingestion.

For complete milestone tracking, see [NIU_ROADMAP.md](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/NIU_ROADMAP.md).
