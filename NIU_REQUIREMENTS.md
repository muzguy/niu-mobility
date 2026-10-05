# NIU Requirements & Functional Specifications
## Network for Intelligent Urban Mobility

This document formalizes the functional requirements across all modules in NIU. Every module clearly delineates between the **PROTOTYPE** (current deterministic simulation) and **FUTURE INTEGRATION** (real-world hardware and external cloud connectivity).

---

## 1. Dashboard (Mobility Command Center)

### Purpose
To deliver a single-pane-of-glass operational command view of urban mobility, active congestion hotspots, carpool activities, and aggregate environmental impact.

### Inputs
- Aggregated telemetry from all city intersections (Pari Chowk, Alpha 1, Alpha 2, Knowledge Park, Jagat Farm).
- Active carpool journey states and passenger requests.
- Temporal simulation state (Rush hour toggle, simulation speed factor).

### Outputs
- High-level KPIs: Citywide Traffic Load (%), Active Trips, Estimated CO2 Saved (tons), Average Delay (min).
- Visual Interactive Mobility Map rendering road arteries, signal nodes, active vehicle densities, and emergency corridor status.
- Real-time simulation event feed and quick action controls.

### Implementation Status
- **PROTOTYPE**:
  - Built with custom SVG/HTML5 interactive canvas map representing Greater Noida corridors.
  - Dynamically responds to intersection selection, displaying modal or sidebar telemetry.
  - Interactive Rush Hour simulation toggle and emergency vehicle simulation trigger.
- **FUTURE INTEGRATION**:
  - Live Mapbox GL vector tile layer with real-time GPS fleet pings.
  - Webhook streaming from municipal traffic command centers and connected vehicle OBUs.

---

## 2. Traffic Intelligence

### Purpose
To monitor arterial intersection loads, detect congestion bottlenecks, inspect directional queue lengths, and assess speed variations.

### Inputs
- Directional vehicle counts (North, South, East, West).
- Queue lengths in meters and average approach speeds in km/h.
- Current fixed or semi-actuated cycle timings.

### Outputs
- Intersection-level telemetry cards with visual congestion badges (Low, Moderate, Severe).
- Directional queue breakdown charts and 24-hour historical traffic volume trends.
- Intersection inspection view with adaptive timing triggers.

### Implementation Status
- **PROTOTYPE**:
  - Seeded with realistic Greater Noida intersection models (Pari Chowk roundabout hub, Knowledge Park academic corridor, Alpha 1 & 2 commercial connectors, Jagat Farm retail hub).
  - Recharts temporal flow curves displaying hourly volume and delay trends.
- **FUTURE INTEGRATION**:
  - Integration with inductive loop sensors, CCTV computer vision vehicle counters (YOLOv8/Deepsort), and radar speed detectors.
  - Municipal SCATS/SCOOT system data ingestion.

---

## 3. Signal Optimization Engine

### Purpose
To reduce unnecessary vehicular idle times and intersection queuing through dynamic, volume-weighted green split adjustments.

### Inputs
- Real-time or simulated directional vehicle count ($V_d$).
- Directional queue length ($Q_d$) in meters.
- Current waiting time ($W_d$) in minutes.
- Minimum green floor ($G_{\min} = 15s$) and yellow clearance ($Y = 4s$).

### Outputs
- Optimized directional green splits (seconds per approach).
- Estimated waiting time reduction percentage ($20\% - 40\%$).
- Estimated vehicular queue reduction percentage ($18\% - 35\%$).
- Simulation state update upon operator confirmation ("Apply Signal Timing").

### Implementation Status
- **PROTOTYPE**:
  - Real deterministic Webster-inspired algorithm allocating green splits proportionally to directional demand indices while keeping cycle length within safe bounds (90s–130s).
  - Operator interactive trigger with "Before vs. After" comparison modal.
  - Explicitly badged as **SIMULATED ESTIMATE**.
- **FUTURE INTEGRATION**:
  - Automated deployment to NTCIP-compliant traffic signal controllers via roadside edge microcontrollers (Raspberry Pi/NVIDIA Jetson).

---

## 4. Carpool Network

### Purpose
To incentivize shared urban transit by matching commuters traveling along overlapping routes, thereby eliminating redundant private single-occupancy vehicles.

### Inputs
- Commuter search parameters: Origin, Destination, Departure Time window, Required Seats.
- Active driver itineraries with vehicle fuel type, total capacity, and intermediate route waypoints.

### Outputs
- Ranked list of matched rides sorted by compatibility score ($0\% - 100\%$).
- Route overlap percentage, departure offset, seat availability, and projected CO2 mitigation per rider.
- Simulated instant ride request confirmation.

### Implementation Status
- **PROTOTYPE**:
  - Multi-variable deterministic matching algorithm scoring spatial overlap, temporal alignment, and detour costs.
  - Interactive search form with presets for Greater Noida sectors and simulated driver profiles (Rohan, Priya, Amit, Sneha, Vikram).
  - Deterministic carbon saving calculation per passenger journey.
- **FUTURE INTEGRATION**:
  - Supabase PostgreSQL with PostGIS spatial indexing for sub-second spatial queries.
  - In-app push notifications, user authentication, and secure verification.

---

## 5. Smart Routes

### Purpose
To provide commuters with multi-objective navigation choices comparing the trade-offs between journey duration, traffic congestion, and carbon footprint.

### Inputs
- Origin and Destination nodes.
- Vehicle specifications (fuel type, fuel efficiency).

### Outputs
- Three distinct route candidates:
  1. **FASTEST**: High-capacity arterial route minimizing travel time.
  2. **BALANCED**: Optimal compromise between transit duration and congestion avoidance.
  3. **GREENEST**: Minimum carbon footprint route via steady-velocity, low-idle corridors.
- Route metrics: Estimated Time of Arrival (ETA), congestion score, distance (km), fuel burn (L), and estimated CO2 (kg).

### Implementation Status
- **PROTOTYPE**:
  - Built with clean provider abstraction (`IRouteProvider`) returning simulated Greater Noida corridor trajectories with real calculated emission factors.
  - Interactive selection highlighting route differences in UI.
- **FUTURE INTEGRATION**:
  - Mapbox Directions API with live traffic matrix, OSRM routing engine, and elevation profile modeling.

---

## 6. Sustainability / Impact Engine

### Purpose
To quantify and visualize the environmental dividend generated by intelligent traffic signal optimization, carpool adoption, and eco-routing.

### Inputs
- Total vehicle-kilometers reduced via carpooling.
- Total idle seconds avoided via signal optimization.
- Vehicle fleet distribution (Petrol, Diesel, Hybrid, EV).

### Outputs
- High-level environmental metrics: Total CO2 saved (kg/tons), Fuel saved (liters), Single-occupancy trips avoided, Idle hours eliminated.
- Multi-dimensional NIU Impact Score ($0 - 100$) with categorical breakdown.
- 7-day cumulative emissions avoidance trend charts.

### Implementation Status
- **PROTOTYPE**:
  - Strict IPCC/EPA carbon accounting algorithms calculating emissions from distance, fuel density, and vehicle class.
  - Interactive sustainability scorecard with animated breakdown gauges and Recharts trend visualizations.
- **FUTURE INTEGRATION**:
  - Verified carbon credit calculation adhering to municipal and ISO 14064 greenhouse gas reporting standards.

---

## 7. Emergency Vehicle Priority

### Purpose
To simulate priority pre-emption corridors for emergency first responders (ambulances and fire engines), clearing congestion ahead of vehicle transit.

### Inputs
- Emergency incident trigger, designated vehicle type, origin and emergency destination hospital.
- Target intersections along the emergency transit corridor.

### Outputs
- Dynamic emergency route activation on the Mobility Map.
- Automated green-light pre-emption along the active corridor.
- Comparative transit calculation: Normal ETA vs. NIU Priority ETA and net minutes saved.

### Implementation Status
- **PROTOTYPE**:
  - Interactive "Simulate Emergency Vehicle" control with animated emergency ambulance moving across the corridor on the SVG map.
  - Visual indicator showing intersection signals switching to prioritized green wave with real-time countdown and delta savings.
  - Clearly badged as a **SIMULATION DEMO**.
- **FUTURE INTEGRATION**:
  - Integration with Emergency Vehicle Pre-emption (EVP) hardware (Opticom / GPS geofencing via cellular V2X / DSRC protocols).
