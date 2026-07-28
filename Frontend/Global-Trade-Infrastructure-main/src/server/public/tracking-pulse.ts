import 'server-only';

/**
 * @file server/public/tracking-pulse.ts
 * @description Server-to-server read of trade-service's public, unauthenticated
 * `/v1/platform_stats` (Phase 0.5 — see plan doc). Deliberately bypasses the
 * browser-facing auth-gateway `/trade-bff/*` proxy entirely: that proxy sits
 * behind `requireSession()` with no per-route public allowlist, so reaching an
 * unauthenticated trade-service route through it would mean widening the
 * gateway's trust boundary. A direct request from this Next.js server to
 * trade-service avoids that — same shape of decision as platform-pulse.ts
 * reaching Postgres directly rather than through a tenant-scoped service.
 *
 * `activeTradeShipments` on that response is the SAME "active" status bucket
 * (booked/picked_up/in_transit/port_processing/customs_clearance/released)
 * the authenticated Global Shipment Tracking Dashboard shows — not a
 * different/legacy count — so the public number stays consistent with what a
 * logged-in user sees.
 */

const TIMEOUT_MS = 3000;

interface PlatformStatsResponse {
  data?: { activeTradeShipments?: unknown };
}

/** Real active-shipment count across every tenant, or null if trade-service is unreachable/slow. */
export async function getActiveShipmentCount(): Promise<number | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3025';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/v1/platform_stats`, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return null;
    const body = (await res.json()) as PlatformStatsResponse;
    const count = body?.data?.activeTradeShipments;
    return typeof count === 'number' && Number.isFinite(count) ? count : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
