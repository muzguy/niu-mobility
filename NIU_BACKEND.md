# NIU Backend Architecture & API Specification

> **NIU: Network for Intelligent Urban Mobility**  
> *"We don't need fewer people moving. We need fewer inefficient journeys."*

This document details the backend, API, service, and persistence architecture of NIU.

---

## 1. Architectural Overview

NIU follows an enterprise-grade multi-tier architecture separating presentation, API routing, business services, data repositories, and deterministic computation engines:

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Next.js 16 UI)               │
│      /           /dashboard     /traffic                    │
│      /carpool    /routes        /impact                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js API Layer                      │
│   src/app/api/                                              │
│     ├── health/              (GET)                          │
│     ├── traffic/             (GET)                          │
│     │     ├── intersections/ (GET)                          │
│     │     ├── optimize/      (POST)                         │
│     │     └── simulation/    (POST)                         │
│     ├── carpool/search/      (GET, POST)                    │
│     ├── routes/              (GET, POST)                    │
│     ├── impact/              (GET)                          │
│     └── emergency/priority/  (GET, POST)                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Service Layer                        │
│   src/services/                                             │
│     ├── traffic-service.ts                                  │
│     ├── carpool-service.ts                                  │
│     ├── routes-service.ts                                   │
│     ├── impact-service.ts                                   │
│     └── emergency-service.ts                                │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│      Repository Layer       │ │    Deterministic Engines    │
│  src/lib/repositories/      │ │  src/lib/                   │
│    ├── types.ts             │ │    ├── traffic/             │
│    ├── simulation-repo.ts   │ │    │     └── optimizer.ts   │
│    ├── supabase-repo.ts     │ │    ├── carpool/             │
│    └── index.ts (Factory)   │ │    │     └── engine.ts      │
└──────────────┬──────────────┘ │    ├── emissions/           │
               │                │    │     └── engine.ts      │
               ▼                │    ├── routing/             │
┌─────────────────────────────┐ │    │     └── engine.ts      │
│     Persistence Layer       │ │    └── emergency/           │
│  - Demo: In-Memory / Local  │ │          └── engine.ts      │
│  - DB: Supabase / Postgres  │ └─────────────────────────────┘
└─────────────────────────────┘
```

---

## 2. Dual Operational Data Modes

NIU operates in two distinct data modes controlled via environment variables:

### Mode 1: Simulation Mode (`NIU_DATA_MODE=simulation`) [DEFAULT]
- **Zero Credentials Needed**: The application launches out-of-the-box without requiring external database credentials or API keys.
- **Deterministic Seed Data**: Uses calibrated baseline parameters for the 5 monitored Greater Noida intersections (Pari Chowk, Sector Alpha 1, Sector Alpha 2, Knowledge Park, Jagat Farm).
- **In-Memory Audit Log**: Tracks simulation runs, signal adjustments, and priority corridor deployments during the process lifetime.

### Mode 2: Database Mode (`NIU_DATA_MODE=database`)
- **PostgreSQL / Supabase**: Connects to Supabase PostgREST tables.
- **Resilient Fallback**: If Supabase credentials are missing or the database becomes unreachable, the repository layer **automatically falls back** to the Simulation Repository without throwing unhandled exceptions or disrupting user experience.
- **Server-Only Security**: The `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to server-side repository files and is never exposed in browser bundles.

---

## 3. Environment Variables

Create or update `.env.local` based on `.env.example`:

```bash
# Data Mode ('simulation' | 'database')
NIU_DATA_MODE=simulation

# Supabase Configuration (Optional for Database Mode)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 4. API Endpoints Reference

All endpoints return a uniform JSON envelope:

**Success Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-05T16:37:17.927Z"
}
```

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid simulation mode specified",
    "details": { "mode": ["Mode must be one of: normal, rush_hour, emergency, optimized"] }
  },
  "timestamp": "2026-10-05T16:37:17.927Z"
}
```

### Endpoints Table

| Method | Endpoint | Description | Request Body / Params |
|---|---|---|---|
| `GET` | `/api/health` | Service status & data mode | None |
| `GET` | `/api/traffic` | Macro traffic metrics & status | None |
| `GET` | `/api/traffic/intersections` | Monitored junction list / single node | Query: `?id=pari-chowk` (optional) |
| `POST` | `/api/traffic/optimize` | Run Webster signal optimization | JSON: `OptimizationInput` |
| `POST` | `/api/traffic/simulation` | Switch simulation scenario | JSON: `{ "mode": "rush_hour" }` |
| `POST` | `/api/carpool/search` | Search shared commute rides | JSON: `{ origin, destination, departureTime, seats }` |
| `GET` | `/api/carpool/search` | Retrieve all active ride listings | None |
| `GET` | `/api/routes` | Eco-navigation comparison | Query: `?origin=...&destination=...` |
| `POST` | `/api/routes` | Eco-navigation comparison | JSON: `{ origin, destination }` |
| `GET` | `/api/impact` | IPCC carbon footprint accounting | None |
| `GET` | `/api/emergency/priority` | Active emergency corridor status | None |
| `POST` | `/api/emergency/priority` | Activate/cancel emergency priority | JSON: `{ "action": "activate", "vehicleId": "AMB-108" }` |

---

## 5. Database Schema & Migrations

The database migration is located at:
[`supabase/migrations/20261005000000_initial_schema.sql`](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/supabase/migrations/20261005000000_initial_schema.sql)

Seed data for reproducible testing is located at:
[`supabase/seed.sql`](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/supabase/seed.sql)

### Tables Implemented

1. `intersections`: Physical Greater Noida monitored corridor nodes.
2. `traffic_snapshots`: Directional vehicle density, queue lengths, approach velocities.
3. `signal_timings`: Webster green-split cycle allocations and reduction projections.
4. `traffic_events`: Arterial surges, clearance notifications, and sensor telemetry.
5. `emergency_events`: Priority pre-emption run logs, ETAs, and averted delay.
6. `carpool_requests`: Commuter ride queries and seating criteria.
7. `carpool_matches`: Deterministic spatial-temporal pairing score records.
8. `route_queries`: Eco-navigation queries comparing Fastest, Balanced, and Greenest routes.
9. `impact_metrics`: Cumulative averted emissions, fuel conservation, and trips pooled.
10. `simulation_runs`: Audit trail of scenario transitions.

---

## 6. API Validation & Security

Incoming payloads are strictly validated using **Zod** (`src/lib/validations/index.ts`):
- String lengths are bounded (e.g. `origin` and `destination` 2-100 characters).
- Numeric values are clamped to physical boundaries (e.g. `vehicleDensity` 0-2000, `seats` 1-8).
- Scenario modes are constrained strictly to `normal | rush_hour | emergency | optimized`.
- Unparseable JSON or invalid parameters return structured HTTP 400 Bad Request responses with field-specific errors.

---

## 7. Curl Examples for Testing

### 1. Health Check
```bash
curl -X GET http://localhost:3000/api/health
```

### 2. Retrieve Traffic State
```bash
curl -X GET http://localhost:3000/api/traffic
```

### 3. Switch Simulation Mode to Rush Hour
```bash
curl -X POST http://localhost:3000/api/traffic/simulation \
  -H "Content-Type: application/json" \
  -d '{"mode": "rush_hour"}'
```

### 4. Optimize Intersection Signal (Webster Equations)
```bash
curl -X POST http://localhost:3000/api/traffic/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "intersectionId": "pari-chowk",
    "vehicleDensity": 142,
    "queueLength": 67,
    "waitingTime": 4.2,
    "currentTiming": { "north": 42, "south": 42, "east": 18, "west": 18 },
    "signals": []
  }'
```

### 5. Search Carpool Rides
```bash
curl -X POST http://localhost:3000/api/carpool/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Alpha 1",
    "destination": "Knowledge Park",
    "departureTime": "08:30 AM",
    "seats": 1
  }'
```

### 6. Compare Eco-Routes
```bash
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -d '{"origin": "Alpha 1", "destination": "Knowledge Park"}'
```

### 7. Trigger Emergency Priority Pre-emption
```bash
curl -X POST http://localhost:3000/api/emergency/priority \
  -H "Content-Type: application/json" \
  -d '{"action": "activate", "vehicleId": "AMB-108"}'
```
