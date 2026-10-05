import type { StyleSpecification } from 'maplibre-gl';

/**
 * Returns the MapLibre style specification or URL for the current theme.
 * Respects NEXT_PUBLIC_MAP_STYLE_URL if configured, otherwise falls back to
 * high-performance CARTO Dark Matter / Positron raster basemaps with OSM attribution.
 */
export function getMapStyle(isDark: boolean): string | StyleSpecification {
  // Configurable external vector/raster style via environment variable
  if (process.env.NEXT_PUBLIC_MAP_STYLE_URL) {
    return process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  }

  if (isDark) {
    return {
      version: 8,
      name: 'NIU Dark Matter Basemap',
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
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
          id: 'carto-dark-tiles',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19,
          paint: {
            'raster-opacity': 0.95,
          },
        },
      ],
    };
  }

  return {
    version: 8,
    name: 'NIU Positron Light Basemap',
    sources: {
      'carto-light': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
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
        id: 'carto-light-tiles',
        type: 'raster',
        source: 'carto-light',
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
