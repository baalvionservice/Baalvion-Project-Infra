'use client';

/**
 * @file corridor-map.tsx
 * @description Entry point for the corridor map. Dynamically imports the Leaflet
 * render with ssr:false, matching live-map.tsx — Leaflet cannot render on the server.
 */
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { CorridorPoint, CorridorMapProps } from './corridor-map-inner';

export type { CorridorPoint };

const CorridorMapInner = dynamic(() => import('./corridor-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border-2 bg-muted/20">
      <Loader2 className="h-8 w-8 animate-spin text-primary opacity-40" />
    </div>
  ),
});

export function CorridorMap(props: CorridorMapProps) {
  return <CorridorMapInner {...props} />;
}
