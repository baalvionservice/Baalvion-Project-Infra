/**
 * @file src/lib/map-provider.ts
 * @description Map provider selection for the Shipment Tracking & Global Visibility Platform.
 * Leaflet + OpenStreetMap tiles are the keyless default (no paid key required to run this
 * feature locally or in demo mode). Google Maps / Mapbox activate only when their public tile
 * keys are configured — same "simulated until key" posture the backend providers use.
 */
export type MapProvider = 'leaflet' | 'mapbox' | 'google';

export function activeMapProvider(): MapProvider {
  if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return 'mapbox';
  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) return 'google';
  return 'leaflet';
}

/** Leaflet tile layer config per provider (Mapbox uses its own tile endpoint; Google isn't a Leaflet tile source, so it falls back to OSM tiles until a dedicated Google Maps JS integration is added). */
export function tileLayerFor(provider: MapProvider): { url: string; attribution: string } {
  if (provider === 'mapbox') {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${token}`,
      attribution: '© Mapbox © OpenStreetMap',
    };
  }
  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  };
}
