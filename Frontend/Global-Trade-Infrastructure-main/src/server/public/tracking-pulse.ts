import 'server-only';

/**
 * @file server/public/tracking-pulse.ts
 * @description Real active-shipment count for the public homepage (Phase 0.5).
 * `activeTradeShipments` is the SAME "active" status bucket
 * (booked/picked_up/in_transit/port_processing/customs_clearance/released)
 * the authenticated Global Shipment Tracking Dashboard shows — not a
 * different/legacy count — so the public number stays consistent with what a
 * logged-in user sees. See trade-service-client.ts for how this reaches
 * trade-service.
 */
import { fetchTradeServicePlatformStats } from './trade-service-client';

/** Real active-shipment count across every tenant, or null if trade-service is unreachable/slow. */
export async function getActiveShipmentCount(): Promise<number | null> {
  const stats = await fetchTradeServicePlatformStats();
  const count = stats?.activeTradeShipments;
  return typeof count === 'number' && Number.isFinite(count) ? count : null;
}
