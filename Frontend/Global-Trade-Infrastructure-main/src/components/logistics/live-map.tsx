'use client';

/**
 * @file live-map.tsx
 * @description Public entry point for the shipment tracking live map. Dynamically imports the
 * Leaflet render with ssr:false — Leaflet cannot run during server-side rendering.
 */
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { MapMarker } from './live-map-inner';

export type { MapMarker };

const LiveMapInner = dynamic(() => import('./live-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-2xl border-2 bg-muted/20">
      <Loader2 className="h-8 w-8 animate-spin text-primary opacity-40" />
    </div>
  ),
});

export function LiveMap(props: { markers: MapMarker[]; height?: number; onMarkerClick?: (marker: MapMarker) => void }) {
  return <LiveMapInner {...props} />;
}
