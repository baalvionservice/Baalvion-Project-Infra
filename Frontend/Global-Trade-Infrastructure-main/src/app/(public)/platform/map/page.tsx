import { Metadata } from 'next';
import { Globe2 } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { listPortsDirectory } from '@/server/gckb/public-read';
import { LiveMap, type MapMarker } from '@/components/logistics/live-map';

/**
 * @file (public)/platform/map/page.tsx
 * @description Public network map — real, published ports plotted on the same
 * Leaflet map used by the authenticated shipment-tracking dashboard. Shipment
 * and risk-alert layers are intentionally NOT here yet: there is no public,
 * tenant-free tracking aggregate endpoint today (tracking data requires an
 * authenticated session against the trade-service). Ports are shown alone
 * because they're the only layer backed by fully public, DB-real data.
 */

const TITLE = 'Live Network Map — Ports Worldwide';
const DESCRIPTION = 'Every published port and point of entry on Baalvion, plotted on one live map.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/platform/map',
  keywords: ['global port map', 'trade network map', 'points of entry map', 'logistics map'],
});

// Reads the GCKB database directly — forced dynamic so build doesn't require a
// reachable DB at build time. See authorities/page.tsx for the full rationale.
export const dynamic = 'force-dynamic';

export default async function PlatformMapPage() {
  // Falls back to an empty directory (rendered via the existing empty state
  // below) rather than crashing the page on a transient DB outage.
  const ports = await listPortsDirectory().catch(() => []);
  const markers: MapMarker[] = [];
  for (const p of ports) {
    if (p.latitude == null || p.longitude == null) continue;
    markers.push({
      id: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      label: `${p.name} · ${p.countryName}`,
      status: p.unlocode ?? p.kind,
      color: '#38bdf8',
    });
  }

  return (
    <>
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Platform', path: '/platform' },
            { name: 'Live Network Map', path: '/platform/map' },
          ]),
        )}
      />

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
            <Globe2 className="size-4" /> Live Network
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">The network, mapped.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">{DESCRIPTION}</p>
          <p className="mt-2 max-w-2xl text-xs text-slate-500">
            {markers.length.toLocaleString()} of {ports.length.toLocaleString()} published ports have coordinates on file.
          </p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          {markers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-24 text-center">
              <p className="text-sm font-bold text-slate-300">No published ports have coordinates yet.</p>
              <p className="mt-1 text-xs text-slate-500">Our institutional data team is expanding this directory. Check back soon.</p>
            </div>
          ) : (
            <LiveMap markers={markers} height={560} />
          )}
        </div>
      </section>
    </>
  );
}
