import React from 'react';
import { Intersection } from '@/types/traffic';
import { useTheme } from '@/context/theme-context';

interface IntersectionMarkerProps {
  intersection: Intersection;
  isSelected: boolean;
  showSignalState: boolean;
  onSelect: (id: string) => void;
}

export function IntersectionMarker({
  intersection,
  isSelected,
  showSignalState,
  onSelect,
}: IntersectionMarkerProps) {
  const { isDark } = useTheme();
  const { coordinates, shortName, congestionLevel, vehicleCount, waitingTimeMinutes, isEmergencyPrioritized, lastOptimizedAt } =
    intersection;

  // Congestion color
  const color =
    isEmergencyPrioritized
      ? '#06b6d4' // Priority Cyan
      : congestionLevel === 'severe'
      ? '#ef4444' // Crimson
      : congestionLevel === 'moderate'
      ? '#f59e0b' // Amber
      : '#10b981'; // Emerald

  const nodeFill = isDark ? '#0b0f19' : '#ffffff';
  const pillFill = isDark ? '#090d16' : '#ffffff';
  const pillStroke = isSelected
    ? (isDark ? '#10b981' : '#059669')
    : (isDark ? '#1e293d' : '#cbd5e1');
  const titleColor = isDark ? '#f1f5f9' : '#0f172a';
  const subtextColor = isDark ? '#94a3b8' : '#475569';

  return (
    <g
      className="cursor-pointer transition-transform duration-200 hover:scale-105"
      onClick={() => onSelect(intersection.id)}
      role="button"
      tabIndex={0}
      aria-label={`Intersection ${shortName}, ${congestionLevel} traffic, ${vehicleCount} vehicles`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(intersection.id);
        }
      }}
    >
      {/* Outer Glow / Emergency Pulse Ring */}
      {isEmergencyPrioritized && (
        <circle
          cx={coordinates.x}
          cy={coordinates.y}
          r={32}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2.5"
          className="animate-beacon opacity-75"
        />
      )}

      {/* Selected Indicator Ring */}
      {isSelected && (
        <circle
          cx={coordinates.x}
          cy={coordinates.y}
          r={26}
          fill="none"
          stroke={isDark ? '#10b981' : '#059669'}
          strokeWidth="2"
          strokeDasharray="4 3"
          className="animate-spin"
          style={{ animationDuration: '8s' }}
        />
      )}

      {/* Outer Node Base */}
      <circle
        cx={coordinates.x}
        cy={coordinates.y}
        r={18}
        fill={nodeFill}
        stroke={color}
        strokeWidth={isSelected ? 3 : 2}
        className="transition-colors duration-300 drop-shadow-md"
      />

      {/* Inner Status Core */}
      <circle
        cx={coordinates.x}
        cy={coordinates.y}
        r={8}
        fill={color}
        className={isEmergencyPrioritized ? 'animate-pulse' : ''}
      />

      {/* Optimized Badge Indicator */}
      {lastOptimizedAt && !isEmergencyPrioritized && (
        <g transform={`translate(${coordinates.x - 18}, ${coordinates.y - 18})`}>
          <circle cx={0} cy={0} r={6} fill={isDark ? '#064e3b' : '#d1fae5'} stroke="#10b981" strokeWidth="1" />
          <path d="M -3 0 L -1 2 L 3 -2" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {/* Label Box (Card style) */}
      <g transform={`translate(${coordinates.x}, ${coordinates.y + 24})`}>
        {/* Background pill */}
        <rect
          x={-62}
          y={0}
          width={124}
          height={32}
          rx={6}
          fill={pillFill}
          fillOpacity={isDark ? 0.94 : 0.98}
          stroke={pillStroke}
          strokeWidth="1.2"
          filter={isDark ? undefined : 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))'}
        />

        {/* Node Name */}
        <text
          x={0}
          y={14}
          textAnchor="middle"
          fill={titleColor}
          fontSize="10"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
        >
          {shortName}
        </text>

        {/* Telemetry snippet */}
        <text
          x={0}
          y={26}
          textAnchor="middle"
          fill={subtextColor}
          fontSize="8.5"
          fontFamily="monospace"
        >
          {vehicleCount} veh · {waitingTimeMinutes}m wait
        </text>
      </g>

      {/* Signal Mini Indicator Badge if enabled */}
      {showSignalState && (
        <g transform={`translate(${coordinates.x + 14}, ${coordinates.y - 18})`}>
          <circle cx={0} cy={0} r={6} fill={nodeFill} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1" />
          <circle
            cx={0}
            cy={0}
            r={3.5}
            fill={
              isEmergencyPrioritized
                ? '#06b6d4'
                : intersection.signals[0]?.state === 'green'
                ? '#10b981'
                : '#ef4444'
            }
          />
        </g>
      )}
    </g>
  );
}
