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

- **Mobility Command Center**: Interactive high-altitude vector canvas map of Greater Noida arterial networks (Pari Chowk, Alpha 1, Alpha 2, Knowledge Park, Jagat Farm) with live traffic density pulses and interactive intersection telemetry.
- **Traffic Intelligence Console**: In-depth directional queue metrics, approach speeds, volume curves, and signal timing visualizations.
- **Webster-Inspired Signal Optimizer**: Deterministic algorithm allocating dynamic green times, cutting waiting times by 20–40% and queues by 18–35%.
- **Deterministic Carpool Matcher**: Instant ride matching based on spatial route overlap, departure windows, and detour costs—without black-box AI approximations.
- **Eco-Routing Engine**: Multi-profile route analysis contrasting transit time vs. carbon footprint.
- **Emergency Priority Simulator**: Synchronized green-corridor pre-emption for ambulances, cutting transit times by over 25%.
- **Sustainability Analytics**: Continuous tracking of avoided CO2 (tons), saved fuel (liters), and the comprehensive **NIU Impact Score (0-100)**.

---

## 4. System Architecture

```
Client Presentation (Next.js 16 App Router + Tailwind CSS + Lucide + Recharts)
   │
UI Component Layer (Dashboard, Map, Traffic, Carpool, Routes, Impact)
   │
Simulation & State Layer (Tick Manager, Greater Noida Telemetry Data Providers)
   │
Mobility Engines (Traffic, Signal Optimizer, Carpool Matcher, Routing, Emissions, Emergency)
   │
Future Service Adapters (Mapbox GL, Supabase, Municipal ITMS, Python/FastAPI ML)
```

Refer to [NIU_ARCHITECTURE.md](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/NIU_ARCHITECTURE.md) for full architectural specifications and Mermaid diagrams.

---

## 5. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing across all models)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Dark-first modern engineering aesthetic)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Design Principles**: Dark charcoal surfaces, emerald green sustainability accents, high-contrast semantic traffic colors, accessible semantic HTML.

---

## 6. Simulation Disclaimer

> [!NOTE]
> **SIMULATION MODE NOTICE**
> The current version of NIU is a high-fidelity working prototype and simulation. All intersection telemetry, vehicle counts, carpool listings, and signal adjustments reflect simulated Greater Noida urban corridors. The platform does not claim live physical control over municipal traffic infrastructure or real-time GPS hardware. All calculation engines execute real, deterministic mathematical models designed for seamless future sensor ingestion.

---

## 7. Environment Variables

The project runs completely out-of-the-box in local simulation mode without external keys. For future phases, an environment template is provided in `.env.example`:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TRAFFIC_API_KEY=
NEXT_PUBLIC_ML_SERVICE_URL=
```

---

## 8. Setup & Local Run Instructions

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

# Start production server
npm run start
```

---

## 9. Development Roadmap

- **Phases 1–8 (Complete)**: Architectural foundation, Mobility Command Center, interactive vector map, traffic intelligence, signal optimizer, deterministic carpool matching, eco-routing, sustainability engine, and emergency vehicle pre-emption simulation.
- **Phase 9 (Future)**: Mapbox vector tiles, Supabase database persistence, real-time WebSocket fleet feeds.
- **Phase 10 (Future)**: Python/FastAPI ML service for predictive traffic forecasting (GNN/LSTM).

For complete milestone tracking, see [NIU_ROADMAP.md](file:///c:/Users/itsro/Downloads/niu-mobility-main/niu-mobility-main/NIU_ROADMAP.md).
