# NIU Geospatial Architecture & Location-Aware Simulation

> **NIU: Network for Intelligent Urban Mobility**  
> *"Real Geography. Honest Provenance. Deterministic Intelligence."*

This document details the geospatial architecture, OpenStreetMap integration, Mobility Zone model, data provenance hierarchy, and location-aware synthetic traffic demand simulation in NIU.

---

## 1. Architectural Overview

NIU decouples geographic reality from traffic observations, allowing the platform to analyze arbitrary geographic areas (such as Galgotias University, Dankaur, Knowledge Park, or any user-searched region) while transparently communicating what is real versus what is estimated or simulated.

```
┌─────────────────────────────────────────────────────────────┐
│                    User Location Query                      │
│        "Galgotias University" / "Dankaur" / Coordinates     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Geocoding & Provider Abstraction              │
│               OSMGeoProvider (Nominatim / Seed)             │
│        - In-memory TTL Cache (3600s)                        │
│        - 3500ms AbortController Timeout                    │
│        - Seed Fallback (Galgotias, Dankaur, Pari Chowk)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Road Network Extraction                     │
│               OSMGeoProvider (Overpass API)                 │
│        - Bounded Query (radius 400m - 2500m)                │
│        - Highway classification & lane extraction           │
│        - Junction derivation & POI extraction               │
│        - 24-Hour TTL Cache                                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Mobility Zone                         │
│  - Bounding Box & Center Coordinates                        │
│  - Normalized Road Segments & Intersections                 │
│  - Explicit Data Availability:                              │
│      • Road Network: REAL (OpenStreetMap)                   │
│      • Traffic Flow: SIMULATED ESTIMATE                     │
│      • Physical Sensors: NOT CONNECTED                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Synthetic Traffic Demand Generator               │
│  - Road capacity by highway classification                  │
│  - Diurnal diurnal curves (university & arterial peaks)     │
│  - BPR speed-flow reduction equations                       │
│  - Deterministic Webster signal timing splits               │
│  - Provenance: source: "simulation", confidence: 0.76       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                NIU Core Traffic Intelligence                │
│  - Command Center Dashboard / Traffic Intelligence Console  │
│  - Webster Adaptive Signal Optimizer                        │
│  - Multi-Objective Eco-Routing Engine                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Concepts

### Mobility Zone
A **Mobility Zone** represents a bounded urban or sub-urban geographical area under analysis:
- **`id`**: Unique alphanumeric slug (e.g. `galgotias-university`, `dankaur-junction`, `greater-noida-core`).
- **`center`**: Central anchor coordinates (`latitude`, `longitude`).
- **`radiusMeters`**: Analysis radius (typically 800m to 2500m).
- **`boundingBox`**: Computed spatial bounds (`minLat`, `maxLat`, `minLng`, `maxLng`).
- **`roads`**: Normalized `GeoRoadSegment`s containing coordinates, highway types, lanes, and speed limits.
- **`intersections`**: Topological junction nodes with signal timings and directional signals.
- **`dataAvailability`**: Strict tripartite availability matrix.
- **`provenance`**: Audit metadata certifying data source and confidence.

### Data Provenance & Availability
NIU never fabricates authenticity or labels simulated observations as live feeds:

| Dimension | Allowed States | Description |
|---|---|---|
| **`roadNetwork`** | `real` \| `fallback` \| `simulated` | Indicates whether road geometry originates from live OpenStreetMap, calibrated seed survey, or synthetic topological generation. |
| **`traffic`** | `live` \| `simulated` | Indicates whether vehicle counts, queue lengths, and approach speeds originate from physical sensors or the synthetic demand model. |
| **`liveSensors`** | `connected` \| `unavailable` | Indicates physical connection status to municipal SCATS, SCOOT, or inductive loop detector feeds. |

---

## 3. Synthetic Traffic Demand Model

Located in [`src/lib/simulation/demand-generator.ts`](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/src/lib/simulation/demand-generator.ts), this engine deterministically computes estimated traffic flow for any Mobility Zone based on:

### 1. Road Capacity by Highway Classification
Derived from standard Indian Roads Congress (IRC) and Highway Capacity Manual (HCM) equivalents:
- **Motorway**: 2,000 veh/hr/lane, 80 km/h free-flow speed
- **Trunk**: 1,750 veh/hr/lane, 65 km/h free-flow speed
- **Primary**: 1,400 veh/hr/lane, 50 km/h free-flow speed
- **Secondary**: 1,050 veh/hr/lane, 42 km/h free-flow speed
- **Tertiary**: 750 veh/hr/lane, 35 km/h free-flow speed
- **Residential**: 450 veh/hr/lane, 28 km/h free-flow speed
- **Service**: 300 veh/hr/lane, 20 km/h free-flow speed

### 2. University & Suburban Diurnal Curves
Models peak hourly fluctuations deterministically:
- `08:00 - 09:30`: Morning peak arrival surge (1.42x - 1.55x)
- `12:00 - 13:30`: Mid-day campus transit (1.18x)
- `16:30 - 18:30`: Evening departure rush (1.40x - 1.52x)
- `22:00 - 06:00`: Off-peak minimal load (0.10x - 0.35x)
- Weekend modifier: 0.65x baseline demand

### 3. Speed-Flow Relationship (BPR Formula)
$$\text{Speed} = \frac{S_0}{1 + \alpha \left(\frac{V}{C}\right)^\beta}$$
Where $S_0$ is free-flow speed, $V/C$ is Volume-to-Capacity ratio, $\alpha = 0.25$, and $\beta = 3.5$.

### 4. Queue Length & Waiting Time
- Queue Length (meters): $\max\left(8, \text{round}\left(\frac{V}{C} \times \text{lanes} \times 28 \times \text{scenarioFactor}\right)\right)$
- Delay / Wait Time (minutes): $\max\left(0.6, 1.2 + \left(\frac{V}{C}\right)^{2.2} \times 3.4 \times \text{scenarioFactor}\right)$

---

## 4. API Endpoints Reference

All endpoints return uniform JSON envelopes:

| Method | Endpoint | Description | Sample Query / Body |
|---|---|---|---|
| `GET` | `/api/location/search` | Geocode location query via OpenStreetMap Nominatim | `?q=Galgotias%20University&limit=5` |
| `GET` | `/api/location/zone` | Query zone by coordinate or list registered zones | `?lat=28.3639&lng=77.5402&radius=1400` |
| `POST` | `/api/location/zone` | Create & register a new Mobility Zone | `{"name": "Galgotias University", "latitude": 28.3639, "longitude": 77.5402, "radiusMeters": 1400}` |
| `GET` | `/api/location/zone/:id` | Retrieve zone metadata, bounds, and provenance | `/api/location/zone/galgotias-university` |
| `GET` | `/api/location/zone/:id/network` | Retrieve road network segments and junctions | `/api/location/zone/galgotias-university/network` |
| `GET` | `/api/location/zone/:id/traffic` | Retrieve location-aware traffic state | `/api/location/zone/galgotias-university/traffic` |
| `GET` | `/api/traffic?zoneId=:id` | Query macro traffic state for specific zone | `/api/traffic?zoneId=galgotias-university` |

---

## 5. Offline & External Failure Safety Hierarchy

NIU is designed for high demo resilience and will never crash or lock up due to external API latency, rate limits, or network partitions:

1. **Live External OpenStreetMap Feed**:
   - Nominatim geocoding with 3500ms timeout and User-Agent compliance.
   - Overpass API road geometry extraction with 4500ms timeout and bounded search area.
2. **In-Memory TTL Caching**:
   - Geocoding results cached for 1 hour.
   - Road network topology cached for 24 hours.
3. **Calibrated Baseline Seeds**:
   - Pre-calibrated geographical seed coordinates and road geometry for:
     - Greater Noida Core / Pari Chowk (`greater-noida-core`)
     - Galgotias University Corridor (`galgotias-university`)
     - Dankaur Town Market & Station Road (`dankaur-junction`)
     - Knowledge Park II & III (`knowledge-park`)
4. **Deterministic Synthetic Grid Generator**:
   - If a new unseeded coordinate is queried and Overpass is unreachable, NIU generates a realistic topological road grid anchored to the requested coordinate.
5. **Default Demo Network Preservation**:
   - The original 5-junction Greater Noida network remains the default and is accessible at all times with one click.

---

## 6. Testing & Curl Examples

### 1. Search for Galgotias University
```bash
curl -X GET "http://localhost:3000/api/location/search?q=Galgotias%20University"
```

### 2. Search for Dankaur
```bash
curl -X GET "http://localhost:3000/api/location/search?q=Dankaur"
```

### 3. Create / Register a Mobility Zone
```bash
curl -X POST "http://localhost:3000/api/location/zone" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Galgotias University",
    "latitude": 28.3639,
    "longitude": 77.5402,
    "radiusMeters": 1400
  }'
```

### 4. Retrieve Location-Aware Traffic Telemetry
```bash
curl -X GET "http://localhost:3000/api/location/zone/galgotias-university/traffic"
```

### 5. Query Traffic State by Zone Parameter
```bash
curl -X GET "http://localhost:3000/api/traffic?zoneId=galgotias-university"
```
