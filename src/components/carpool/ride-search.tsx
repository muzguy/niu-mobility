'use client';

import React, { useState } from 'react';
import { RideSearchQuery } from '@/types/carpool';
import { Search, MapPin, Clock, Users, ArrowRightLeft } from 'lucide-react';

interface RideSearchProps {
  onSearch: (query: RideSearchQuery) => void;
  isLoading?: boolean;
}

const PRESET_LOCATIONS = [
  'Alpha 1',
  'Alpha 2',
  'Pari Chowk',
  'Knowledge Park',
  'Jagat Farm',
];

export function RideSearch({ onSearch, isLoading }: RideSearchProps) {
  const [origin, setOrigin] = useState<string>('Alpha 1');
  const [destination, setDestination] = useState<string>('Knowledge Park');
  const [departureTime, setDepartureTime] = useState<string>('08:30 AM');
  const [seats, setSeats] = useState<number>(1);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      origin,
      destination,
      departureTime,
      seats,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/90 p-5 shadow-xs backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Find a Shared Commute</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deterministic spatial-temporal matching to reduce single-occupancy vehicles
          </p>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
          LOCAL SIMULATED NETWORK
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Origin */}
          <div className="md:col-span-5 relative">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Origin</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {PRESET_LOCATIONS.map((loc) => (
                  <option key={`orig-${loc}`} value={loc} disabled={loc === destination}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap Origin and Destination"
              aria-label="Swap locations"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-6 relative">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {PRESET_LOCATIONS.map((loc) => (
                  <option key={`dest-${loc}`} value={loc} disabled={loc === origin}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Second Row: Time, Seats, Submit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-12 gap-3 items-end">
          {/* Departure Time */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Departure Window</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 dark:text-slate-400" />
              <select
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="08:00 AM">08:00 AM (Early Rush)</option>
                <option value="08:15 AM">08:15 AM</option>
                <option value="08:25 AM">08:25 AM</option>
                <option value="08:35 AM">08:35 AM</option>
                <option value="08:45 AM">08:45 AM (Peak)</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="05:30 PM">05:30 PM (Evening Return)</option>
                <option value="05:45 PM">05:45 PM</option>
              </select>
            </div>
          </div>

          {/* Seats Needed */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Seats Needed</label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 dark:text-slate-400" />
              <select
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value={1}>1 Seat</option>
                <option value={2}>2 Seats</option>
                <option value={3}>3 Seats</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Computing Matches...' : 'Match Shared Rides'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
