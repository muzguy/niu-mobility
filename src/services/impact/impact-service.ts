import { calculateSustainabilityScore } from '@/lib/emissions/emissions-engine';
import { getRepository } from '@/lib/repositories';
import { SustainabilityScore } from '@/types/impact';

export interface WeeklyImpactItem {
  day: string;
  carpoolKg: number;
  signalOptKg: number;
  ecoRouteKg: number;
  totalSavedKg: number;
}

export class ImpactService {
  private repo = getRepository();

  public async getImpactData(): Promise<{
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
    const metricsRecord = await this.repo.getImpactMetrics();
    const score = calculateSustainabilityScore();

    const weeklyImpactData: WeeklyImpactItem[] = [
      { day: 'Mon', carpoolKg: 380, signalOptKg: 240, ecoRouteKg: 190, totalSavedKg: 810 },
      { day: 'Tue', carpoolKg: 420, signalOptKg: 260, ecoRouteKg: 210, totalSavedKg: 890 },
      { day: 'Wed', carpoolKg: 460, signalOptKg: 290, ecoRouteKg: 230, totalSavedKg: 980 },
      { day: 'Thu', carpoolKg: 490, signalOptKg: 310, ecoRouteKg: 250, totalSavedKg: 1050 },
      { day: 'Fri', carpoolKg: 540, signalOptKg: 340, ecoRouteKg: 290, totalSavedKg: 1170 },
      { day: 'Sat', carpoolKg: 310, signalOptKg: 180, ecoRouteKg: 150, totalSavedKg: 640 },
      { day: 'Sun', carpoolKg: 280, signalOptKg: 160, ecoRouteKg: 130, totalSavedKg: 570 },
    ];

    return {
      metrics: {
        estimatedCo2SavedTons: metricsRecord.co2SavedTons,
        fuelSavedLiters: metricsRecord.fuelSavedLiters,
        tripsAvoided: metricsRecord.vehiclesSaved,
        commuteHoursSaved: metricsRecord.timeSavedHours,
        sustainabilityIndex: metricsRecord.sustainabilityIndex,
      },
      sustainabilityScore: score,
      weeklyImpactData,
      environmentalEquivalencies: {
        treeSeedlingsTenYears: 82,
        smartphoneChargesAverted: 221950,
        smogParticulatesPm25Kg: 3.84,
      },
      protocol: 'IPCC Tier-1 Greenhouse Gas Protocol',
      timestamp: new Date().toISOString(),
    };
  }
}

export const impactService = new ImpactService();
