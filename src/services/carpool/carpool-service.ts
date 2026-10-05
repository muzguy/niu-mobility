import { carpoolEngine } from '@/lib/carpool/carpool-engine';
import { getRepository } from '@/lib/repositories';
import { RideMatchResult, RideSearchQuery, CarpoolRide } from '@/types/carpool';

export class CarpoolService {
  private repo = getRepository();

  public async searchMatches(query: RideSearchQuery): Promise<{
    matches: RideMatchResult[];
    totalMatches: number;
    potentialCo2DividendKg: number;
    searchQuery: RideSearchQuery;
  }> {
    // 1. Deterministic match execution via carpoolEngine
    const matches = carpoolEngine.searchRides(query);

    // 2. Compute aggregate dividend
    const potentialCo2DividendKg = Number(
      matches.reduce((sum, item) => sum + item.co2SavingKg, 0).toFixed(1)
    );

    // 3. Log search query to repository
    await this.repo.saveCarpoolRequest({
      userIdentifier: 'simulated_commuter_app',
      origin: query.origin,
      destination: query.destination,
      departureTime: query.departureTime,
      seatsRequired: query.seats,
      status: matches.length > 0 ? 'matched' : 'active',
    });

    return {
      matches,
      totalMatches: matches.length,
      potentialCo2DividendKg,
      searchQuery: query,
    };
  }

  public async getAllRides(): Promise<CarpoolRide[]> {
    return carpoolEngine.getAllRides();
  }

  public async bookSeat(rideId: string, seatCount = 1): Promise<{ success: boolean; remainingSeats: number }> {
    const success = carpoolEngine.bookSeat(rideId, seatCount);
    const ride = carpoolEngine.getRideById(rideId);
    return {
      success,
      remainingSeats: ride?.availableSeats ?? 0,
    };
  }
}

export const carpoolService = new CarpoolService();
