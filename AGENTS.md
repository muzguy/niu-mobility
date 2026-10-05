<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NIU — Agent Operating Rules & Guidelines

## 1. Project Purpose
NIU (Network for Intelligent Urban Mobility) is an enterprise-grade intelligent urban mobility platform connecting commuters, vehicles, roads, and mobility data to reduce unnecessary vehicular movement, traffic congestion, travel delay, and carbon emissions. Designed as a flagship B.Tech CSE sustainability system, NIU integrates traffic intelligence, adaptive signal optimization, deterministic carpool matching, eco-routing comparison, emergency vehicle pre-emption, and carbon emissions modeling into a unified Mobility Command Center.

## 2. Workspace Boundary Rules (STRICT)
- **Zero Outside Access**: NEVER access, modify, delete, move, or create files outside the project root directory (`c:\Users\itsro\Downloads\niu-mobility-main\niu-mobility-main`).
- **Parent Directory Isolation**: Never touch the parent directory (`Downloads`) or sibling directories.
- **Git Safety**: Do not push commits to remote repositories without explicit user instruction.
- **No Artifact Pollution**: Keep generated scratch files within the designated temporary or artifacts directory; do not pollute repository root with temporary dumps.

## 3. Architecture Rules
- **Layered Decoupling**: Strictly separate UI presentation components (`src/components/`), deterministic mobility computation engines (`src/lib/`), and the simulation data layer (`src/data/`).
- **Provider Pattern for Extensibility**: Routing, traffic data, and map layers must use provider abstractions (interfaces) so future external services (Mapbox, OSRM, Supabase, municipal SCATS/SCOOT feeds, ML models) can replace simulated providers without modifying presentation components.
- **Single Source of Truth**: The simulation engine maintains the active temporal state (rush hour multiplier, intersection status, active emergency runs) and broadcasts deterministic updates.

## 4. Coding Standards & Naming Conventions
- **TypeScript Strictness**: Always use explicit TypeScript types and interfaces; never use `any`. Type definitions belong in `src/types/`.
- **File Naming**:
  - Components: kebab-case filenames (e.g., `signal-timing.tsx`, `mobility-map.tsx`).
  - Utility/Engine modules: kebab-case (e.g., `signal-optimizer.ts`, `emissions-engine.ts`).
  - Types & Data: kebab-case (e.g., `intersections.ts`, `traffic.ts`).
- **Component Design**: Prefer React Server Components by default; reserve `'use client'` strictly for components with interactive state, hooks (`useState`, `useEffect`), or client-side charts.
- **Styling**: Use utility classes via Tailwind CSS adhering to the dark-first design system. Avoid arbitrary magic numbers where CSS variables or tokenized classes exist.

## 5. Simulation & Data Integrity Rules
- **No False Authenticity**: Never fabricate mock responses and label them as "live" or "real-time production feeds". Every screen, metric card, and map layer MUST clearly state **"SIMULATION MODE"** or **"SIMULATED ESTIMATE"**.
- **Deterministic Algorithms**: Prototype calculation modules (Signal Optimization, Carpool Matching, Route Emissions, and Emergency Corridor Pre-emption) must execute deterministic, mathematically grounded algorithms rather than random placeholder numbers.
- **Location Realism**: Base simulated road networks and intersections on realistic Greater Noida coordinates and urban topology (Pari Chowk, Alpha 1, Alpha 2, Knowledge Park, Jagat Farm).

## 6. Security & API Key Rules
- **Zero Secret Exposure**: Never commit real API keys, secrets, or service account credentials.
- **Mock Interfaces Only**: Do not initialize paid external services (Mapbox, Google Maps, Supabase) in the current phase.
- **Configuration Hygiene**: Use `.env.example` with blank placeholders to document required environment variables for future phases. Never create `.env.local` containing fake secrets.

## 7. Accessibility (A11y) Rules
- Use semantic HTML tags (`<main>`, `<nav>`, `<header>`, `<section>`, `<article>`, `<button>`).
- Ensure all interactive elements have keyboard focus outlines, ARIA attributes (`aria-label`, `aria-expanded`, `role="status"`), and high contrast ratios.
- Never rely exclusively on color to signify state: pair color coding with iconographic and textual indicators (e.g., Green = Low / Amber = Moderate / Red = Severe Congestion).

## 8. Performance Rules
- Optimize bundle weight: Do not introduce heavy runtime libraries when lightweight native alternatives suffice.
- Isolate re-renders: Keep simulation interval timers contained within dedicated client hooks or localized state providers.
- SVG Map Optimization: Ensure vector map assets and animations use hardware-accelerated CSS transforms (`translate3d`, `opacity`) without triggering layout thrashing.

## 9. Testing & Validation Expectations
- All TypeScript files must compile cleanly with `tsc --noEmit` / `npm run build`.
- ESLint must report 0 errors and 0 unhandled warnings.
- Test responsive layouts from mobile (375px) up to high-density desktop displays (1920px+).
