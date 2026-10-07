'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  createInitialSimulationState,
  SimulationState,
  SimulationTrafficMode,
  setSimulationTrafficMode,
} from '@/lib/simulation/simulation-engine';
import { Direction, Intersection, CongestionLevel } from '@/types/traffic';
import { CityMobilityMetrics, SimulationEvent } from '@/types/mobility';
import { EmergencyCorridor } from '@/types/traffic';
import { aggregateCityMetrics } from '@/lib/traffic/traffic-engine';
import { apiTriggerEmergency, apiSetSimulationScenario } from '@/lib/api-client';
import { calculateMobilityState, UnifiedMobilityState } from '@/lib/simulation/unified-simulation-state';
import { SimulatedIncident } from '@/types/incident';

interface SimulationContextValue {
  state: SimulationState;
  mobilityState: UnifiedMobilityState;
  intersections: Intersection[];
  metrics: CityMobilityMetrics;
  events: SimulationEvent[];
  emergencyCorridor: EmergencyCorridor;
  selectedIntersection: Intersection | null;
  isRushHour: boolean;
  simulationMode: SimulationTrafficMode;
  activeIncident: SimulatedIncident | null;
  setIncident: (incident: SimulatedIncident | null) => void;
  selectIntersection: (id: string | null) => void;
  toggleRushHour: () => void;
  triggerEmergency: () => void;
  setSimulationMode: (mode: SimulationTrafficMode) => void;
  applySignalOptimization: (intersectionId: string, newTiming: Record<Direction, number>) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SimulationState>(createInitialSimulationState());
  const [activeIncident, setActiveIncident] = useState<SimulatedIncident | null>(null);

  const mobilityState = useMemo<UnifiedMobilityState>(() => {
    return calculateMobilityState({
      scenario: state.simulationMode,
      incident: activeIncident,
    });
  }, [state.simulationMode, activeIncident]);

  const setIncident = useCallback((incident: SimulatedIncident | null) => {
    setActiveIncident(incident);
    setState((prev) => setSimulationTrafficMode(prev, prev.simulationMode, incident));
  }, []);

  const selectIntersection = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedIntersectionId: id }));
  }, []);

  const toggleRushHour = useCallback(() => {
    setState((prev) => {
      const nextMode = prev.simulationMode === 'rush_hour' ? 'normal' : 'rush_hour';
      apiSetSimulationScenario(nextMode).catch(() => {});
      return setSimulationTrafficMode(prev, nextMode, activeIncident);
    });
  }, [activeIncident]);

  const triggerEmergency = useCallback(() => {
    setState((prev) => {
      const nextMode = prev.simulationMode === 'emergency' ? 'normal' : 'emergency';
      const action = nextMode === 'emergency' ? 'activate' : 'cancel';
      apiTriggerEmergency(action).catch(() => {});
      apiSetSimulationScenario(nextMode).catch(() => {});
      return setSimulationTrafficMode(prev, nextMode, activeIncident);
    });
  }, [activeIncident]);

  const setSimulationMode = useCallback((mode: SimulationTrafficMode) => {
    setState((prev) => setSimulationTrafficMode(prev, mode, activeIncident));
    apiSetSimulationScenario(mode).catch(() => {});
  }, [activeIncident]);

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
      mobilityState,
      intersections: state.intersections,
      metrics: state.metrics,
      events: state.events,
      emergencyCorridor: state.emergencyCorridor,
      selectedIntersection,
      isRushHour: state.isRushHour,
      simulationMode: state.simulationMode,
      activeIncident,
      setIncident,
      selectIntersection,
      toggleRushHour,
      triggerEmergency,
      setSimulationMode,
      applySignalOptimization,
    }),
    [
      state,
      mobilityState,
      activeIncident,
      setIncident,
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
