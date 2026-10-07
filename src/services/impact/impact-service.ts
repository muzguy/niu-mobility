import { calculateSustainabilityScore } from '@/lib/emissions/emissions-engine';
import { calculateMobilityState } from '@/lib/simulation/unified-simulation-state';
import { SimulationTrafficMode } from '@/lib/simulation/simulation-engine';
import { SustainabilityScore } from '@/types/impact';

export interface WeeklyImpactItem {
  day: string;
  carpoolKg: number;
  signalOptKg: number;
  ecoRouteKg: number;
  totalSavedKg: number;
}

export class ImpactService {
  public async getImpactData(scenario: SimulationTrafficMode = 'normal'): Promise<{
    metrics: {
      estimatedCo2SavedTons: number;
      fuelSavedLiters: number;
      tripsAvoided: number;
      commuteHoursSaved: number;
      sustainabilityIndex: number;
    };
    sustainabilityScore: SustainabilityScore;
    weeklyImpactData: WeeklyImpactItem[];
    environmentalEquivalencies: {
      treeSeedlingsTenYears: number;
      smartphoneChargesAverted: number;
      smogParticulatesPm25Kg: number;
    };
    protocol: string;
    timestamp: string;
  }> {
    const unified = calculateMobilityState({ scenario });
    const score = calculateSustainabilityScore(scenario);

    const scenarioFactor = scenario === 'rush_hour' ? 1.25 : scenario === 'optimized' ? 1.40 : scenario === 'emergency' ? 1.10 : 1.0;

    const weeklyImpactData: WeeklyImpactItem[] = [
      { day: 'Mon', carpoolKg: Math.round(380 * scenarioFactor), signalOptKg: Math.round(240 * scenarioFactor), ecoRouteKg: Math.round(190 * scenarioFactor), totalSavedKg: Math.round(810 * scenarioFactor) },
      { day: 'Tue', carpoolKg: Math.round(420 * scenarioFactor), signalOptKg: Math.round(260 * scenarioFactor), ecoRouteKg: Math.round(210 * scenarioFactor), totalSavedKg: Math.round(890 * scenarioFactor) },
      { day: 'Wed', carpoolKg: Math.round(460 * scenarioFactor), signalOptKg: Math.round(290 * scenarioFactor), ecoRouteKg: Math.round(230 * scenarioFactor), totalSavedKg: Math.round(980 * scenarioFactor) },
      { day: 'Thu', carpoolKg: Math.round(490 * scenarioFactor), signalOptKg: Math.round(310 * scenarioFactor), ecoRouteKg: Math.round(250 * scenarioFactor), totalSavedKg: Math.round(1050 * scenarioFactor) },
      { day: 'Fri', carpoolKg: Math.round(540 * scenarioFactor), signalOptKg: Math.round(340 * scenarioFactor), ecoRouteKg: Math.round(290 * scenarioFactor), totalSavedKg: Math.round(1170 * scenarioFactor) },
      { day: 'Sat', carpoolKg: Math.round(310 * scenarioFactor), signalOptKg: Math.round(180 * scenarioFactor), ecoRouteKg: Math.round(150 * scenarioFactor), totalSavedKg: Math.round(640 * scenarioFactor) },
      { day: 'Sun', carpoolKg: Math.round(280 * scenarioFactor), signalOptKg: Math.round(160 * scenarioFactor), ecoRouteKg: Math.round(130 * scenarioFactor), totalSavedKg: Math.round(570 * scenarioFactor) },
    ];

    return {
      metrics: {
        estimatedCo2SavedTons: unified.co2SavedTons,
        fuelSavedLiters: unified.fuelSavedLiters,
        tripsAvoided: unified.tripsAvoided,
        commuteHoursSaved: unified.commuteHoursSaved,
        sustainabilityIndex: unified.niuScore,
      },
      sustainabilityScore: score,
      weeklyImpactData,
      environmentalEquivalencies: {
        treeSeedlingsTenYears: Math.round(unified.co2SavedTons * 45),
        smartphoneChargesAverted: Math.round(unified.co2SavedTons * 121950),
        smogParticulatesPm25Kg: Number((unified.fuelSavedLiters * 0.0048).toFixed(2)),
      },
      protocol: 'IPCC Tier-1 Greenhouse Gas Protocol',
      timestamp: new Date().toISOString(),
    };
  }
}

export const impactService = new ImpactService();
