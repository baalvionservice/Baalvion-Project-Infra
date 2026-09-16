'use client';

/**
 * @file leaflet-canvas.tsx
 * @description A small, correct Leaflet host for this app's maps.
 *
 * WHY NOT react-leaflet's MapContainer. In react-leaflet 4.2.1 the map is built in a
 * ref callback but torn down in an effect keyed on the context it sets — so on the
 * first pass the cleanup closes over a null context and never calls `map.remove()`.
 * React 18's development double-mount then hands the same DOM node back to a fresh
 * ref callback, Leaflet finds its own claim (`_leaflet_id`) still on it, and throws
 * "Map container is already initialized". That killed every map in this app.
 *
 * This host owns the element, builds the map in an effect and removes it in that
 * effect's own cleanup, so mounting twice is harmless. Layers are drawn imperatively
 * from `draw`, which re-runs whenever its dependencies change.
 */
import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';
import { activeMapProvider, tileLayerFor } from '@/lib/map-provider';

export interface LeafletCanvasProps {
  /** Draw the map's layers. Return value is ignored; add layers to `layers`. */
  draw: (leaflet: typeof L, map: L.Map, layers: L.LayerGroup) => void;
  /** Re-run `draw` when any of these change. Anything derived from props belongs here. */
  drawKey: string;
  center: [number, number];
  zoom: number;
  height?: number;
  scrollWheelZoom?: boolean;
  className?: string;
}

export function LeafletCanvas({
  draw,
  drawKey,
  center,
  zoom,
  height = 420,
  scrollWheelZoom = false,
  className,
}: LeafletCanvasProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  // Read through refs so changing them never forces the map to be rebuilt.
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const viewRef = useRef({ center, zoom });
  viewRef.current = { center, zoom };

  useEffect(() => {
    let cancelled = false;
    const node = nodeRef.current;
    if (!node) return undefined;

    // Leaflet reaches for `window` at import time, so it is loaded here rather than
    // at module scope — this component is already client-only, but a static import
    // would still be evaluated during the server render of its parent.
    import('leaflet').then((mod) => {
      const leaflet = (mod.default ?? mod) as typeof L;
      if (cancelled || !nodeRef.current) return;

      const map = leaflet.map(nodeRef.current, {
        center: viewRef.current.center,
        zoom: viewRef.current.zoom,
        scrollWheelZoom,
      });
      const tile = tileLayerFor(activeMapProvider());
      leaflet.tileLayer(tile.url, { attribution: tile.attribution }).addTo(map);

      const layers = leaflet.layerGroup().addTo(map);
      leafletRef.current = leaflet;
      mapRef.current = map;
      layersRef.current = layers;
      drawRef.current(leaflet, map, layers);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layersRef.current = null;
      // `map.remove()` releases Leaflet's claim on the node; clearing it as well means
      // a remount onto the same element can never hit the "already initialized" throw.
      if (node) delete (node as unknown as { _leaflet_id?: number })._leaflet_id;
    };
  }, [scrollWheelZoom]);

  // Redraw the layers whenever the data behind them changes.
  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!leaflet || !map || !layers) return;
    layers.clearLayers();
    map.setView(center, zoom);
    drawRef.current(leaflet, map, layers);
    // `drawKey` is the caller's summary of everything `draw` closes over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawKey]);

  return <div ref={nodeRef} style={{ height, width: '100%' }} className={className ?? 'rounded-2xl'} />;
}
