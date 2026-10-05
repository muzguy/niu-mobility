'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  createInitialSimulationState,
  SimulationState,
  SimulationTrafficMode,
  setSimulationTrafficMode,
  toggleEmergencySimulation,
  toggleRushHourState,
} from '@/lib/simulation/simulation-engine';
import { Direction, Intersection, CongestionLevel } from '@/types/traffic';
import { CityMobilityMetrics, SimulationEvent } from '@/types/mobility';
import { EmergencyCorridor } from '@/types/traffic';
import { aggregateCityMetrics } from '@/lib/traffic/traffic-engine';

interface SimulationContextValue {
  state: SimulationState;
  intersections: Intersection[];
  metrics: CityMobilityMetrics;
  events: SimulationEvent[];
  emergencyCorridor: EmergencyCorridor;
  selectedIntersection: Intersection | null;
  isRushHour: boolean;
  simulationMode: SimulationTrafficMode;
  selectIntersection: (id: string | null) => void;
  toggleRushHour: () => void;
  triggerEmergency: () => void;
  setSimulationMode: (mode: SimulationTrafficMode) => void;
  applySignalOptimization: (intersectionId: string, newTiming: Record<Direction, number>) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SimulationState>(createInitialSimulationState());

  const selectIntersection = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedIntersectionId: id }));
  }, []);

  const toggleRushHour = useCallback(() => {
    setState((prev) => toggleRushHourState(prev));
  }, []);

  const triggerEmergency = useCallback(() => {
    setState((prev) => toggleEmergencySimulation(prev));
  }, []);

  const setSimulationMode = useCallback((mode: SimulationTrafficMode) => {
    setState((prev) => setSimulationTrafficMode(prev, mode));
  }, []);

  const applySignalOptimization = useCallback(
    (intersectionId: string, newTiming: Record<Direction, number>) => {
      setState((prev) => {
        const updated: Intersection[] = prev.intersections.map((node) => {
          if (node.id !== intersectionId) return node;

          const updatedQueue = Math.max(10, Math.round(node.queueLengthMeters * 0.72));
          const updatedWait = Math.max(1.0, Number((node.waitingTimeMinutes * 0.68).toFixed(1)));
          const updatedSpeed = Math.min(48, Math.round(node.averageSpeedKmH * 1.25));

          return {
            ...node,
            signalTiming: newTiming,
            queueLengthMeters: updatedQueue,
            waitingTimeMinutes: updatedWait,
            averageSpeedKmH: updatedSpeed,
            congestionLevel: (updatedQueue > 50 ? 'moderate' : 'low') as CongestionLevel,
            lastOptimizedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            signals: node.signals.map((sig) => ({
              ...sig,
              greenSeconds: newTiming[sig.direction] || sig.greenSeconds,
              queueLengthMeters: Math.round(sig.queueLengthMeters * 0.72),
              waitingTimeMinutes: Number((sig.waitingTimeMinutes * 0.68).toFixed(1)),
            })),
          };
        });

        const updatedMetrics = aggregateCityMetrics(updated);

        const targetNode = prev.intersections.find((n) => n.id === intersectionId);
        const optEvent: SimulationEvent = {
          id: `evt-${Date.now()}`,
          timestamp: 'Just now',
          category: 'signal',
          title: 'Signal Timing Deployed',
          description: `Webster split applied to ${targetNode?.name || intersectionId}. Queue reduced by ~28%.`,
          severity: 'success',
        };

        return {
          ...prev,
          intersections: updated,
          metrics: updatedMetrics,
          events: [optEvent, ...prev.events.slice(0, 14)],
        };
      });
    },
    []
  );

  const selectedIntersection = useMemo(() => {
    if (!state.selectedIntersectionId) return null;
    return state.intersections.find((i) => i.id === state.selectedIntersectionId) || null;
  }, [state.intersections, state.selectedIntersectionId]);

  const value = useMemo(
    () => ({
      state,
      intersections: state.intersections,
      metrics: state.metrics,
      events: state.events,
      emergencyCorridor: state.emergencyCorridor,
      selectedIntersection,
      isRushHour: state.isRushHour,
      simulationMode: state.simulationMode,
      selectIntersection,
      toggleRushHour,
      triggerEmergency,
      setSimulationMode,
      applySignalOptimization,
    }),
    [
      state,
      selectedIntersection,
      selectIntersection,
      toggleRushHour,
      triggerEmergency,
      setSimulationMode,
      applySignalOptimization,
    ]
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
