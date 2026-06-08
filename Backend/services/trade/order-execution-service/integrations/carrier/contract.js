'use strict';
/**
 * ============================================================================
 * CARRIER TRACKING — integration contract
 * ============================================================================
 * Seam point: contract-only here today. Logistics/shipment tracking lives in the
 * Node trade-service; this boundary lets the order path observe shipment milestones.
 *
 * Real vendor = Project44 / FourKites / Freightos, carrier EDI, or AIS feeds.
 *
 * POSTURE: FAIL-OPEN / DEGRADED. Tracking is observational — if the provider is
 * unavailable, the order path continues with stale/last-known data and surfaces a
 * degraded flag. It MUST NOT block fulfillment on missing tracking (unlike
 * sanctions/customs which are fail-closed).
 */

/**
 * Normalized shipment milestone. Adapters map carrier-specific events onto these.
 * @readonly
 * @enum {string}
 */
const TRACKING_STATUS = Object.freeze({
    UNKNOWN: 'UNKNOWN',
    BOOKED: 'BOOKED',
    IN_TRANSIT: 'IN_TRANSIT',
    CUSTOMS_HOLD: 'CUSTOMS_HOLD',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    EXCEPTION: 'EXCEPTION',
});

const TERMINAL_STATUSES = Object.freeze(['DELIVERED']);

/**
 * @typedef {Object} TrackingEvent
 * @property {string} timestamp   ISO-8601
 * @property {keyof typeof TRACKING_STATUS} status
 * @property {string} [location]
 * @property {string} [description]
 */

/**
 * @typedef {Object} TrackingResult
 * @property {string} trackingNumber
 * @property {string} [carrier]
 * @property {keyof typeof TRACKING_STATUS} status   latest milestone
 * @property {TrackingEvent[]} events
 * @property {string} [eta]        ISO-8601 estimated delivery
 * @property {boolean} degraded    true when data is stale/unavailable (fail-open)
 */

/**
 * @typedef {Object} CarrierProvider
 * @property {string} name
 * @property {boolean} IS_PRODUCTION_SAFE
 * @property {(args: {trackingNumber: string, carrier?: string, tenantId?: string}) => Promise<TrackingResult>} track
 *   MUST resolve (never reject) on provider unavailability — returns a degraded
 *   result with status UNKNOWN, honoring the fail-open posture.
 */

/**
 * @readonly
 */
const FAILURE_MODES = Object.freeze({
    TIMEOUT: 'On timeout/unavailability return a degraded:true result (status UNKNOWN, last-known events if any) — do NOT throw and do NOT block the order.',
    IDEMPOTENCY: 'track() is read-only and freely retryable; it has no side effects.',
    PARTIAL: 'Carriers emit out-of-order/duplicate events; the adapter normalizes to the latest milestone and may return partial event history.',
    POSTURE: 'FAIL-OPEN / DEGRADED — tracking is observational; missing data degrades visibility but never blocks fulfillment.',
});

module.exports = { TRACKING_STATUS, TERMINAL_STATUSES, FAILURE_MODES };
