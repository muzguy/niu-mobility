'use client';

import React, { useState, useEffect } from 'react';
import { ROAD_SEGMENTS } from '@/data/intersections';
import { useSimulation } from '@/context/simulation-context';
import { IntersectionMarker } from './intersection-marker';
import { MapControls } from './map-controls';
import { MapLegend } from './map-legend';
import { Ambulance } from 'lucide-react';

interface MobilityMapProps {
  onSelectIntersection?: (id: string) => void;
  heightClass?: string;
}

export function MobilityMap({ onSelectIntersection, heightClass = 'h-[540px]' }: MobilityMapProps) {
  const {
    intersections,
    selectedIntersection,
    selectIntersection,
    emergencyCorridor,
    isRushHour,
  } = useSimulation();

  const [zoom, setZoom] = useState<number>(1.0);
  const [showTrafficFlow, setShowTrafficFlow] = useState<boolean>(true);
  const [showSignalStates, setShowSignalStates] = useState<boolean>(true);

  // Animated ambulance position along corridor (Alpha 1 -> Pari Chowk -> Knowledge Park)
  const [ambulancePos, setAmbulancePos] = useState<{ x: number; y: number; angle: number }>({
    x: 230,
    y: 220,
    angle: 25,
  });

  useEffect(() => {
    if (!emergencyCorridor.active) return;

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 100;
      // Waypoint 1: Alpha 1 (230, 220) to Pari Chowk (480, 330) -> first 50%
      // Waypoint 2: Pari Chowk (480, 330) to Knowledge Park (740, 350) -> next 50%
      if (step < 50) {
        const t = step / 50;
        const x = 230 + (480 - 230) * t;
        const y = 220 + (330 - 220) * t;
        setAmbulancePos({ x, y, angle: 24 });
      } else {
        const t = (step - 50) / 50;
        const x = 480 + (740 - 480) * t;
        const y = 330 + (350 - 330) * t;
        setAmbulancePos({ x, y, angle: 4 });
      }
    }, 150);

    return () => clearInterval(interval);
  }, [emergencyCorridor.active]);

  const handleSelect = (id: string) => {
    selectIntersection(id);
    if (onSelectIntersection) {
      onSelectIntersection(id);
    }
  };

  const getSegmentStroke = (congestion: 'low' | 'moderate' | 'severe') => {
    switch (congestion) {
      case 'low':
        return '#10b981';
      case 'moderate':
        return '#f59e0b';
      case 'severe':
        return '#ef4444';
    }
  };

  return (
    <div
      className={`relative w-full ${heightClass} rounded-xl border border-slate-800 bg-[#080c14] overflow-hidden select-none flex flex-col`}
    >
      {/* Top Banner / Breadcrumb Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-auto">
        <div className="bg-[#0b0f19]/90 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-200">GREATER NOIDA SECTOR GRID</span>
          <span className="text-slate-500">•</span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            SIMULATION
          </span>
          {isRushHour && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              RUSH HOUR (+35%)
            </span>
          )}
        </div>
      </div>

      {/* Emergency Active Status Header Overlay */}
      {emergencyCorridor.active && (
        <div className="absolute top-3 right-16 z-10 pointer-events-auto bg-rose-950/90 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs text-rose-200 flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <Ambulance className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>Priority Corridor: Alpha 1 ➔ Pari Chowk ➔ Knowledge Park</span>
          </div>
          <div className="flex items-center gap-2 border-l border-rose-800 pl-2 text-[11px] font-mono">
            <span>Normal ETA: 14m 32s</span>
            <span className="text-emerald-300 font-bold">NIU: 10m 51s (-3m 41s)</span>
          </div>
        </div>
      )}

      {/* Vector SVG Canvas Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 1000 640"
          className="w-full h-full object-contain transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Interactive Greater Noida Mobility Network Map"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141c2e" strokeWidth="0.8" opacity="0.6" />
            </pattern>

            {/* Glowing filter for active lines */}
            <filter id="glow-emergency" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="640" fill="#080c14" />
          <rect width="1000" height="640" fill="url(#grid)" />

          {/* Road Network Base Layer (Thick asphalt base) */}
          <g id="road-base-lines">
            {ROAD_SEGMENTS.map((seg) => (
              <path
                key={`base-${seg.id}`}
                d={seg.svgPath}
                stroke="#172033"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </g>

          {/* Road Lane Markings (Dashed white/slate lines) */}
          <g id="road-lanes">
            {ROAD_SEGMENTS.map((seg) => (
              <path
                key={`lane-${seg.id}`}
                d={seg.svgPath}
                stroke="#1f2d47"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </g>

          {/* Congestion Color Overlay */}
          <g id="road-congestion">
            {ROAD_SEGMENTS.map((seg) => {
              const strokeColor = getSegmentStroke(seg.congestionLevel);
              return (
                <path
                  key={`cong-${seg.id}`}
                  d={seg.svgPath}
                  stroke={strokeColor}
                  strokeWidth="3.5"
                  strokeOpacity="0.75"
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
          </g>

          {/* Traffic Flow Animation Pulses */}
          {showTrafficFlow && (
            <g id="traffic-pulses">
              {ROAD_SEGMENTS.map((seg) => {
                const strokeColor = getSegmentStroke(seg.congestionLevel);
                return (
                  <path
                    key={`pulse-${seg.id}`}
                    d={seg.svgPath}
                    stroke={strokeColor}
                    strokeWidth="4"
                    strokeDasharray="10 24"
                    className="animate-pulse-flow opacity-90"
                    fill="none"
                  />
                );
              })}
            </g>
          )}

          {/* Emergency Priority Highlight Corridor */}
          {emergencyCorridor.active && (
            <g id="emergency-corridor-highlight">
              {/* Alpha 1 -> Pari Chowk */}
              <path
                d="M 230 220 L 480 330"
                stroke="#06b6d4"
                strokeWidth="8"
                strokeOpacity="0.8"
                filter="url(#glow-emergency)"
                strokeLinecap="round"
                className="animate-pulse-flow-fast"
                strokeDasharray="14 18"
                fill="none"
              />
              {/* Pari Chowk -> Knowledge Park */}
              <path
                d="M 480 330 L 740 350"
                stroke="#06b6d4"
                strokeWidth="8"
                strokeOpacity="0.8"
                filter="url(#glow-emergency)"
                strokeLinecap="round"
                className="animate-pulse-flow-fast"
                strokeDasharray="14 18"
                fill="none"
              />

              {/* Animated Ambulance Icon traveling on corridor */}
              <g
                transform={`translate(${ambulancePos.x}, ${ambulancePos.y}) rotate(${ambulancePos.angle})`}
                className="transition-all duration-150"
              >
                <circle cx="0" cy="0" r="14" fill="#080c14" stroke="#ef4444" strokeWidth="2" />
                <circle cx="0" cy="0" r="18" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-beacon" />
                {/* Ambulance Cross Marker */}
                <rect x="-6" y="-2" width="12" height="4" fill="#ef4444" rx="1" />
                <rect x="-2" y="-6" width="4" height="12" fill="#ef4444" rx="1" />
              </g>
            </g>
          )}

          {/* Intersections Marker Nodes */}
          <g id="intersections-layer">
            {intersections.map((node) => (
              <IntersectionMarker
                key={node.id}
                intersection={node}
                isSelected={selectedIntersection?.id === node.id}
                showSignalState={showSignalStates}
                onSelect={handleSelect}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Floating Bottom Left: Legend */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:block">
        <MapLegend />
      </div>

      {/* Floating Bottom Right: Controls */}
      <div className="absolute bottom-3 right-3 z-10">
        <MapControls
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(1.6, z + 0.15))}
          onZoomOut={() => setZoom((z) => Math.max(0.8, z - 0.15))}
          onReset={() => setZoom(1.0)}
          showTrafficFlow={showTrafficFlow}
          onToggleTrafficFlow={() => setShowTrafficFlow((v) => !v)}
          showSignalStates={showSignalStates}
          onToggleSignalStates={() => setShowSignalStates((v) => !v)}
        />
      </div>
    </div>
  );
}
