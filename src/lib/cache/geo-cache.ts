interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class GeoCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries = 500;

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds: number): void {
    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }
}

// Global singleton across hot-reloading in dev and production
declare global {
  var __niu_geo_cache: GeoCache | undefined;
}

export function getGeoCache(): GeoCache {
  if (!globalThis.__niu_geo_cache) {
    globalThis.__niu_geo_cache = new GeoCache();
  }
  return globalThis.__niu_geo_cache;
}

export const geoCache = getGeoCache();
