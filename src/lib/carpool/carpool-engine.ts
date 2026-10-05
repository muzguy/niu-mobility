import { INITIAL_RIDES } from '@/data/rides';
import { CarpoolRide, RideMatchResult, RideSearchQuery } from '@/types/carpool';
import { matchRide } from './matching';

export class CarpoolEngine {
  private rides: CarpoolRide[];

  constructor(initialRides: CarpoolRide[] = INITIAL_RIDES) {
    this.rides = [...initialRides];
  }

  public searchRides(query: RideSearchQuery): RideMatchResult[] {
    const results = this.rides.map((ride) => matchRide(query, ride));

    // Sort descending by match score
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  public getAllRides(): CarpoolRide[] {
    return this.rides;
  }

  public getRideById(id: string): CarpoolRide | undefined {
    return this.rides.find((r) => r.id === id);
  }

  public bookSeat(rideId: string, seatCount: number = 1): boolean {
    const ride = this.rides.find((r) => r.id === rideId);
    if (!ride || ride.availableSeats < seatCount) return false;
    ride.availableSeats -= seatCount;
    return true;
  }
}

export const carpoolEngine = new CarpoolEngine();
