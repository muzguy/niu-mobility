'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, RefreshCw, X } from 'lucide-react';
import { MobilityZone, LocationSearchResult } from '@/types/geospatial';
import { apiSearchLocations, apiGetMobilityZone } from '@/lib/api-client';

interface LocationSelectorProps {
  activeZoneId?: string;
  onZoneSelect: (zoneId: string, zone?: MobilityZone) => void;
  className?: string;
}

const PRESET_ZONES = [
  { id: 'greater-noida-core', label: 'Greater Noida Core (Pari Chowk)' },
  { id: 'galgotias-university', label: 'Galgotias University' },
  { id: 'dankaur-junction', label: 'Dankaur Junction' },
];

export function LocationSelector({
  activeZoneId = 'greater-noida-core',
  onZoneSelect,
  className = '',
}: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeZone, setActiveZone] = useState<MobilityZone | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load active zone details
  useEffect(() => {
    let isMounted = true;
    async function loadZone() {
      try {
        const res = await apiGetMobilityZone(activeZoneId);
        if (isMounted && res.success && res.data) {
          setActiveZone(res.data);
        }
      } catch {
        // Fallback
      }
    }

    if (activeZoneId) {
      loadZone();
    }
    return () => {
      isMounted = false;
    };
  }, [activeZoneId]);

  // Handle outside click to close search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (!value.trim() || value.length < 2) {
      setSearchResults([]);
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiSearchLocations(searchQuery, 4);
        if (res.success && res.data?.results) {
          setSearchResults(res.data.results);
          setIsOpen(true);
        }
      } catch {
        // Fallback
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = async (item: LocationSearchResult) => {
    setIsOpen(false);
    setSearchQuery('');

    try {
      // POST or GET /api/location/zone with coordinates
      const res = await fetch('/api/location/zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          radiusMeters: 1400,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setActiveZone(data.data);
        onZoneSelect(data.data.id, data.data);
      } else {
        // Fallback to item id
        onZoneSelect(item.id);
      }
    } catch {
      onZoneSelect(item.id);
    }
  };

  const handleSelectPreset = (zoneId: string) => {
    onZoneSelect(zoneId);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Bar & Quick Zone Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsOpen(true);
              }}
              placeholder="Search arbitrary location or university (e.g. Galgotias, Dankaur)..."
              className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => handleInputChange('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (searchResults.length > 0 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xl overflow-hidden backdrop-blur-md">
              <div className="p-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                OpenStreetMap Geocoding Candidates
              </div>
              {isSearching ? (
                <div className="p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  Resolving geographic coordinates...
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.displayName}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E • Source: {item.source.toUpperCase()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden md:inline">
            Presets:
          </span>
          {PRESET_ZONES.map((preset) => {
            const isActive = activeZoneId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Mobility Zone & Data Provenance Card */}
      {activeZone && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1523]/80 p-3.5 shadow-xs backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {activeZone.name}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Radius: {activeZone.radiusMeters}m
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Anchor: {activeZone.center.latitude.toFixed(4)}°N, {activeZone.center.longitude.toFixed(4)}°E • {activeZone.intersections.length} Monitored Junctions
                </p>
              </div>
            </div>

            {/* Reset to Default */}
            {activeZoneId !== 'greater-noida-core' && (
              <button
                onClick={() => handleSelectPreset('greater-noida-core')}
                className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-medium cursor-pointer self-start md:self-auto"
              >
                <RefreshCw className="w-3 h-3" />
                Reset to Greater Noida Default
              </button>
            )}
          </div>

          {/* Explicit Data Availability Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-1">
            {/* Road Network */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Road Network
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                REAL (OSM)
              </span>
            </div>

            {/* Traffic Telemetry */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Traffic Flow
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                SIMULATED ESTIMATE
              </span>
            </div>

            {/* Physical Sensors */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Physical Sensors
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                NOT CONNECTED
              </span>
            </div>
          </div>

          {/* Provenance note */}
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2.5 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">
              {activeZone.provenance.notes || 'Synthetic demand derived from OSM classification & diurnal curves.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
