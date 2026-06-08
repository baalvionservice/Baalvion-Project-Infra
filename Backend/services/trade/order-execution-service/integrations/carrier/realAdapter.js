'use strict';
/**
 * ============================================================================
 * REAL carrier-tracking adapter — AfterShip Tracking API v4 (PRODUCTION-SAFE).
 * ============================================================================
 * Backed by `providers/aftership.js`. Resolves a tracking number (+ optional
 * carrier slug) into a normalized shipment milestone + checkpoint history so the
 * order path can OBSERVE fulfillment progress.
 *
 * POSTURE: FAIL-OPEN / DEGRADED. track() NEVER rejects. On ANY error — timeout,
 * 5xx, network, or NOT_CONFIGURED — it resolves to a degraded:true UNKNOWN
 * result. Tracking is observational: a missing/down provider degrades visibility
 * but MUST NOT block fulfillment. This is the OPPOSITE of payment/sanctions
 * (which throw IntegrationRequiredError when unconfigured and fail closed). For
 * that reason an unconfigured carrier adapter is still IS_PRODUCTION_SAFE:true —
 * the unconfigured state is surfaced via `degraded:true` (+ reason
 * 'NOT_CONFIGURED'), not via a thrown IntegrationRequiredError.
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   AFTERSHIP_API_KEY         AfterShip API key            (required to leave degraded)
 *   AFTERSHIP_WEBHOOK_SECRET  verify inbound tracking webhooks (optional)
 *   AFTERSHIP_BASE_URL        override base url             (optional, default api.aftership.com/v4)
 *   CARRIER_TIMEOUT_MS        per-attempt timeout, ms       (optional, default 5000)
 *
 * WIRING NOTE: this adapter is the read-side seam only. The order path observes
 * shipment milestones via track() / the verified webhook (see webhook.js).
 * Wiring these milestones into the fulfillment state machine (e.g.
 * DELIVERED -> close fulfillment, CUSTOMS_HOLD -> raise a visibility flag) is a
 * later, supervised step — and because tracking is fail-open it must never gate
 * a state transition on tracking availability.
 */
const { createAftershipProvider } = require('./providers/aftership');

/**
 * @param {{ http?: Function, env?: (name:string)=>string }} [deps]
 * @returns {import('./contract').CarrierProvider}
 */
function createRealCarrierProvider(deps = {}) {
    const provider = createAftershipProvider(deps);
    return {
        name: 'aftership',
        IS_PRODUCTION_SAFE: true,
        IS_CONFIGURED: provider.IS_CONFIGURED,
        track: provider.track,
    };
}

module.exports = { createRealCarrierProvider };
