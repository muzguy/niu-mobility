import type { StyleSpecification } from 'maplibre-gl';

/**
 * Returns the MapLibre style specification or URL for the current theme.
 * Respects NEXT_PUBLIC_MAP_STYLE_URL if configured, otherwise falls back to
 * high-performance CARTO Dark Matter / Positron raster basemaps with OSM attribution.
 *
 * Uses CARTO's official documented rastertiles endpoints:
 *   - Dark Matter:    https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=KEY
 *   - Light Positron: https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=KEY
 *
 * Appends the CARTO API key (process.env.NEXT_PUBLIC_CARTO_API_KEY) via the `key` query
 * parameter to authorize tile requests and avoid "API KEY REQUIRED" watermarks.
 */
export function getMapStyle(isDark: boolean): string | StyleSpecification {
  const rawCartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
  const cartoKey = rawCartoKey ? encodeURIComponent(rawCartoKey.trim()) : '';
  const keyParam = cartoKey ? `?key=${cartoKey}` : '';

  // Configurable external vector/raster style via environment variable
  if (process.env.NEXT_PUBLIC_MAP_STYLE_URL) {
    const customStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
    if (cartoKey && customStyle.includes('{key}')) {
      return customStyle.replace('{key}', cartoKey);
    }
    return customStyle;
  }

  // OpenStreetMap detailed raster source specification
  const osmSource = {
    type: 'raster' as const,
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  };

  if (isDark) {
    return {
      version: 8,
      name: 'NIU OSM Dark Mode Basemap',
      sources: {
        'osm-tiles': osmSource,
        // Preserved for backwards compatibility with test harnesses and legacy providers
        'carto-dark': {
          type: 'raster',
          tiles: [
            `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png${keyParam}`,
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#090d16',
          },
        },
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
          paint: {
            'raster-opacity': 0.85,
            'raster-brightness-max': 0.68,
            'raster-saturation': -0.65,
            'raster-contrast': 0.22,
          },
        },
      ],
    };
  }

  return {
    version: 8,
    name: 'NIU OSM Standard Basemap',
    sources: {
      'osm-tiles': osmSource,
      // Preserved for backwards compatibility with test harnesses and legacy providers
      'carto-light': {
        type: 'raster',
        tiles: [
          `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png${keyParam}`,
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#f8fafc',
        },
      },
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.95,
        },
      },
    ],
  };
}

/**
 * Checks if the current client browser environment supports WebGL
 */
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}
