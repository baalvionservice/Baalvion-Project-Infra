'use client';

/**
 * @file corridor-map-inner.tsx
 * @description The Leaflet render of a planned corridor.
 *
 * The one thing this has to get right that a naive polyline does not: a trans-Pacific
 * corridor crosses the antimeridian, where longitude jumps from +180 to -180. Drawn
 * literally, the line runs the wrong way round the entire globe. Longitudes are
 * unwrapped into a continuous series first, so the track goes the way the ship does.
 */
import { LeafletCanvas } from './leaflet-canvas';

export interface CorridorPoint {
  name: string;
  latitude: number;
  longitude: number;
  /** Ends of the corridor are drawn larger than the waypoints between them. */
  kind: 'endpoint' | 'waypoint' | 'inland';
}

export interface CorridorMapProps {
  points: CorridorPoint[];
  /** A second track drawn faintly behind the first — the canal-free alternative. */
  alternative?: CorridorPoint[];
  height?: number;
}

/**
 * Shift each longitude by whole turns so no step between consecutive points exceeds
 * 180 degrees. The result may run past +/-180, which is exactly what Leaflet needs to
 * draw a continuous Pacific crossing.
 */
function unwrap(points: { latitude: number; longitude: number }[]): [number, number][] {
  let offset = 0;
  return points.map((point, i) => {
    if (i > 0) {
      const delta = point.longitude + offset - (points[i - 1].longitude + offset);
      if (delta > 180) offset -= 360;
      else if (delta < -180) offset += 360;
    }
    return [point.latitude, point.longitude + offset] as [number, number];
  });
}

const TONE = {
  endpoint: { radius: 8, color: '#2563eb', fill: '#2563eb' },
  waypoint: { radius: 4, color: '#64748b', fill: '#94a3b8' },
  inland: { radius: 7, color: '#0d9488', fill: '#14b8a6' },
} as const;

export default function CorridorMapInner({ points, alternative, height = 420 }: CorridorMapProps) {
  const track = unwrap(points);
  const lats = points.map((p) => p.latitude);
  const lngs = track.map(([, lng]) => lng);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  // A corridor spanning half the planet needs a wider view than a coastal hop.
  const span = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
  const zoom = span > 120 ? 1 : span > 60 ? 2 : span > 25 ? 3 : span > 10 ? 5 : 7;

  return (
    <LeafletCanvas
      height={height}
      center={center}
      zoom={zoom}
      drawKey={`${points.map((p) => `${p.latitude},${p.longitude}`).join('|')}::${alternative?.length ?? 0}`}
      draw={(leaflet, _map, layers) => {
        if (alternative && alternative.length > 1) {
          leaflet
            .polyline(unwrap(alternative), { color: '#f59e0b', weight: 2, opacity: 0.5, dashArray: '6 6' })
            .addTo(layers);
        }

        leaflet.polyline(track, { color: '#2563eb', weight: 3, opacity: 0.85 }).addTo(layers);

        points.forEach((point, i) => {
          const tone = TONE[point.kind];
          leaflet
            .circleMarker(track[i], {
              radius: tone.radius,
              color: tone.color,
              fillColor: tone.fill,
              fillOpacity: 0.9,
              weight: 2,
            })
            .bindPopup(point.name)
            .addTo(layers);
        });
      }}
    />
  );
}
