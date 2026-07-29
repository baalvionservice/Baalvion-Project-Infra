import 'server-only';

/**
 * @file server/public/trade-service-client.ts
 * @description Shared server-to-server fetch of trade-service's public,
 * unauthenticated `/v1/platform_stats` — the single real data source behind
 * both the homepage's "Active Shipments" tile (Phase 0.5) and the Trust
 * Center's audit-chain integrity section (Phase 3). Deliberately bypasses the
 * browser-facing auth-gateway `/trade-bff/*` proxy entirely: that proxy sits
 * behind `requireSession()` with no per-route public allowlist, so reaching an
 * unauthenticated trade-service route through it would mean widening the
 * gateway's trust boundary. A direct request from this Next.js server to
 * trade-service avoids that — same shape of decision as platform-pulse.ts
 * reaching Postgres directly rather than through a tenant-scoped service.
 */

const TIMEOUT_MS = 3000;

export interface TradeServicePlatformStats {
  activeTradeShipments?: number;
  auditChainValid?: boolean;
  auditChainEntries?: number | null;
  auditChainHeadHashPrefix?: string | null;
}

interface PlatformStatsResponse {
  data?: TradeServicePlatformStats;
}

/** Raw trade-service platform_stats payload, or null if unreachable/slow/malformed. Never throws. */
export async function fetchTradeServicePlatformStats(): Promise<TradeServicePlatformStats | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3025';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/v1/platform_stats`, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return null;
    const body = (await res.json()) as PlatformStatsResponse;
    return body?.data ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
