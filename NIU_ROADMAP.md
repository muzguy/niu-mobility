# NIU Development Roadmap & Evolution Milestones
## Network for Intelligent Urban Mobility

---

### PHASE 1 — Architectural Foundation (Current Milestone)
- [x] Project scaffolding with Next.js App Router, TypeScript, Tailwind CSS, Lucide React, and Recharts.
- [x] Strict workspace isolation, operating rules (`AGENTS.md`), and clean software architecture.
- [x] Establishment of domain type contracts (`src/types/`) and realistic Greater Noida simulation datasets (`src/data/`).
- [x] Deterministic computation core: Emissions Engine, Signal Optimizer, Carpool Matcher, and Routing Engine.

### PHASE 2 — Mobility Command Dashboard
- [x] Core Command Center dashboard interface (`/dashboard` & `/`).
- [x] High-visibility operational KPIs: City Traffic Load, Active Trips, Estimated CO2 Mitigated, Average Delay.
- [x] Real-time simulation event stream and status monitoring.
- [x] Prominent "● SIMULATION MODE" indicators and disclaimers.

### PHASE 3 — Interactive Custom Mobility Map
- [x] Custom SVG/HTML vector canvas map depicting Greater Noida urban corridors.
- [x] Interactive nodes for key intersections: Pari Chowk, Alpha 1, Alpha 2, Knowledge Park, Jagat Farm.
- [x] Real-time arterial flow visualization with color-coded congestion states (Green, Amber, Red).
- [x] Interactive inspection drawer displaying intersection queue metrics, vehicle counts, and signal timing.

### PHASE 4 — Traffic Intelligence & Signal Optimization
- [x] Dedicated Traffic Intelligence operational console (`/traffic`).
- [x] Multi-approach signal visualization (North, South, East, West) with active phase status.
- [x] Deterministic Webster-inspired Signal Optimization Engine allocating dynamic green splits.
- [x] Interactive optimization modal displaying queue clearance projections and delay reductions with simulation state commit.

### PHASE 5 — Deterministic Carpool Matching
- [x] Commuter carpool search interface (`/carpool`) with origin, destination, time, and seat filters.
- [x] Multi-parameter matching algorithm evaluating spatial corridor overlap, departure window affinity, and detour penalties.
- [x] Interactive ride match cards displaying driver details, route overlap percentage, and personalized CO2 savings.
- [x] Simulated booking confirmation workflow.

### PHASE 6 — Multi-Objective Smart Routing
- [x] Route comparison interface (`/routes`) contrasting FASTEST, BALANCED, and GREENEST corridors.
- [x] Granular metrics per route: travel time, distance, congestion index, fuel burn, and carbon footprint.
- [x] Clean `IRouteProvider` abstraction isolating the UI layer from underlying navigation providers.

### PHASE 7 — Sustainability & Carbon Accounting Engine
- [x] Sustainability analytics dashboard (`/impact`) tracking cumulative environmental impact.
- [x] Mathematical IPCC/EPA emission modeling based on fuel type, engine efficiency, and occupancy.
- [x] NIU Sustainability Scorecard ($0 - 100$) evaluating carpool adoption, signal efficiency, and idle reduction.
- [x] Recharts 7-day cumulative emissions reduction and vehicle trip mitigation charts.

### PHASE 8 — Emergency Vehicle Priority (EVP) Simulation
- [x] Emergency responder priority mode with animated ambulance corridor routing on the interactive map.
- [x] Automated green-wave pre-emption clearing downstream intersection signals.
- [x] Comparative transit calculation: Normal transit vs. Priority transit and time saved.
- [x] Operator override and emergency corridor termination controls.

---

### PHASE 9 — Real-World API & Cloud Integration (Future)
- [ ] Mapbox GL JS / MapLibre vector tile integration with live satellite and terrain layers.
- [ ] OSRM / Mapbox Directions API for live turn-by-turn routing with traffic constraints.
- [ ] Supabase PostgreSQL database integration for persistent commuter profiles, carpool listings, and ride coordination.
- [ ] Real-time WebSocket streaming for connected vehicle location beacons and municipal sensor feeds.
- [ ] Municipal ITMS / SCATS traffic controller integration via standard NTCIP protocols.

### PHASE 10 — Machine Learning & Predictive Traffic Modeling (Future)
- [ ] Python/FastAPI microservice running Spatio-Temporal Graph Neural Networks (ST-GNN) or LSTM architectures.
- [ ] 30-minute to 2-hour predictive traffic congestion forecasting.
- [ ] Proactive traffic signal timing scheduling ahead of anticipated congestion waves.
- [ ] Automated incident detection via computer vision CCTV feeds.
