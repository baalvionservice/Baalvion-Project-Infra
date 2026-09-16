'use client';

/**
 * @file live-map-inner.tsx
 * @description The Leaflet render for the shipment tracking map — isolated from
 * live-map.tsx so it can be loaded via next/dynamic with ssr:false.
 *
 * Circle markers are used instead of the default pin icon to sidestep Leaflet's
 * well-known broken default-icon-path issue under Next.js bundling. The map itself is
 * hosted by LeafletCanvas rather than react-leaflet's MapContainer, whose teardown is
 * unsound under React 18's development double-mount — see that file for the detail.
 */
import { LeafletCanvas } from './leaflet-canvas';

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  status?: string;
  color?: string;
};

type Props = {
  markers: MapMarker[];
  height?: number;
  onMarkerClick?: (marker: MapMarker) => void;
};

const DEFAULT_CENTER: [number, number] = [20, 0]; // world-view fallback when there are no markers yet

export default function LiveMapInner({ markers, height = 480, onMarkerClick }: Props) {
  const center: [number, number] = markers.length ? [markers[0].latitude, markers[0].longitude] : DEFAULT_CENTER;

  return (
    <LeafletCanvas
      height={height}
      center={center}
      zoom={markers.length ? 5 : 2}
      scrollWheelZoom
      drawKey={markers.map((m) => `${m.id}:${m.latitude},${m.longitude}:${m.color ?? ''}`).join('|')}
      draw={(leaflet, _map, layers) => {
        for (const marker of markers) {
          const color = marker.color || '#2563eb';
          const circle = leaflet
            .circleMarker([marker.latitude, marker.longitude], {
              radius: 8,
              color,
              fillColor: color,
              fillOpacity: 0.85,
            })
            .bindPopup(
              `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em">${marker.label}</div>` +
                (marker.status ? `<div style="font-size:10px;text-transform:uppercase;opacity:0.6">${marker.status}</div>` : ''),
            )
            .addTo(layers);
          if (onMarkerClick) circle.on('click', () => onMarkerClick(marker));
        }
      }}
    />
  );
}
