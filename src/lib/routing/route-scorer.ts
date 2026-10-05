import { SmartRouteAlternative } from '@/types/routing';

export interface ScoreComponents {
  timeScore: number;
  congestionScore: number;
  emissionsScore: number;
  delayScore: number;
  compositeScore: number;
}

/**
 * Deterministically computes normalized NIU Score (0–100) and recommendation rationale.
 *
 * Normalization Strategy:
 * - 35% Travel Time Efficiency (relative to minimum duration across alternatives)
 * - 30% Congestion Index (100 - route congestion index)
 * - 20% Carbon Emissions Footprint (relative to minimum emissions across alternatives)
 * - 15% Intersection Signal Delay (Webster queue waiting penalty)
 */
export function scoreAndRankRoutes(
  routes: Array<Omit<SmartRouteAlternative, 'niuScore' | 'isRecommended' | 'recommendationReason' | 'scoreBreakdown'>>
): SmartRouteAlternative[] {
  if (routes.length === 0) return [];

  const minDuration = Math.min(...routes.map((r) => r.durationSeconds));
  const minEmissions = Math.min(...routes.map((r) => r.emissionsKg));

  // Compute normalized scores
  const scored = routes.map((r) => {
    // Relative duration penalty (0 to 70 points deduction for excess transit time)
    const timeDeltaPct = minDuration > 0 ? (r.durationSeconds - minDuration) / minDuration : 0;
    const timeScore = Math.max(15, Math.min(100, Math.round(100 - timeDeltaPct * 75)));

    // Direct inverse congestion score (0 = gridlock -> score 10; 0 congestion -> score 100)
    const congestionScore = Math.max(10, Math.min(100, Math.round(100 - r.congestionScore)));

    // Relative emissions footprint score
    const co2DeltaPct = minEmissions > 0 ? (r.emissionsKg - minEmissions) / minEmissions : 0;
    const emissionsScore = Math.max(20, Math.min(100, Math.round(100 - co2DeltaPct * 65)));

    // Intersection delay penalty (2 minutes delay = 50 pt deduction)
    const delayScore = Math.max(15, Math.min(100, Math.round(100 - (r.intersectionDelaySeconds / 120) * 50)));

    // Weighted composite score (0-100)
    const compositeScore = Math.round(
      0.35 * timeScore +
      0.30 * congestionScore +
      0.20 * emissionsScore +
      0.15 * delayScore
    );

    return {
      route: r,
      scoreBreakdown: {
        timeScore,
        congestionScore,
        emissionsScore,
        delayScore,
      },
      niuScore: Math.min(100, Math.max(10, compositeScore)),
    };
  });

  // Find the top route by NIU Score
  let highestScore = -1;
  let topIndex = 0;
  scored.forEach((item, idx) => {
    if (item.niuScore > highestScore) {
      highestScore = item.niuScore;
      topIndex = idx;
    }
  });

  // Generate deterministic recommendation rationale comparing top route against alternatives
  return scored.map((item, idx) => {
    const isRecommended = idx === topIndex;
    let recommendationReason = '';

    if (isRecommended) {
      const otherRoutes = scored.filter((_, i) => i !== topIndex);
      if (otherRoutes.length > 0) {
        const primaryAlt = otherRoutes[0];
        const timeDiffMin = Number(((primaryAlt.route.durationSeconds - item.route.durationSeconds) / 60).toFixed(1));
        const co2DiffPct = Math.round(
          ((primaryAlt.route.emissionsKg - item.route.emissionsKg) / Math.max(0.01, primaryAlt.route.emissionsKg)) * 100
        );

        if (timeDiffMin > 0 && co2DiffPct > 0) {
          recommendationReason = `${timeDiffMin} min faster with lower congestion and ${co2DiffPct}% lower estimated CO2.`;
        } else if (timeDiffMin > 0) {
          recommendationReason = `${timeDiffMin} min faster despite slightly higher speed-flow variance.`;
        } else if (co2DiffPct > 0) {
          recommendationReason = `Lowest carbon corridor with ${co2DiffPct}% lower emissions and minimal signal delays.`;
        } else {
          recommendationReason = `Optimal multi-criteria balance across transit time, road capacity, and intersection delay.`;
        }
      } else {
        recommendationReason = `Optimal multi-criteria route selected with NIU Score ${item.niuScore}/100.`;
      }
    } else {
      const diffFromTopMin = Number(((item.route.durationSeconds - scored[topIndex].route.durationSeconds) / 60).toFixed(1));
      if (diffFromTopMin > 0) {
        recommendationReason = `Alternative path: +${diffFromTopMin} min additional transit time vs NIU Optimal.`;
      } else {
        recommendationReason = `Alternative corridor with higher congestion or emission penalty.`;
      }
    }

    return {
      ...item.route,
      niuScore: item.niuScore,
      isRecommended,
      recommendationReason,
      scoreBreakdown: item.scoreBreakdown,
    };
  });
}
