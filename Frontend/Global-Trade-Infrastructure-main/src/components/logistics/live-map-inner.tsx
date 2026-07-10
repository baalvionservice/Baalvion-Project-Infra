'use client';

/**
 * @file live-map-inner.tsx
 * @description The actual Leaflet map render — isolated from live-map.tsx so it can be loaded via
 * next/dynamic with ssr:false (Leaflet touches `window` and cannot render on the server). Circle
 * markers are used instead of the default pin icon to sidestep Leaflet's well-known broken
 * default-icon-path issue under Next.js bundling.
 */
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { activeMapProvider, tileLayerFor } from '@/lib/map-provider';

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
  const provider = activeMapProvider();
  const tile = tileLayerFor(provider);
  const center: [number, number] = markers.length
    ? [markers[0].latitude, markers[0].longitude]
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={markers.length ? 5 : 2}
      style={{ height, width: '100%' }}
      className="rounded-2xl"
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.latitude, m.longitude]}
          radius={8}
          pathOptions={{ color: m.color || '#2563eb', fillColor: m.color || '#2563eb', fillOpacity: 0.85 }}
          eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m) } : undefined}
        >
          <Popup>
            <div className="text-xs font-bold uppercase tracking-wide">{m.label}</div>
            {m.status && <div className="text-[10px] text-muted-foreground uppercase">{m.status}</div>}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
