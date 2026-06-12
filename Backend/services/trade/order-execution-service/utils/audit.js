'use strict';
/**
 * War Room 3 — money-movement audit (order-execution-service).
 *
 * Emits the platform audit contract { audit, type, decision, ts, ... } as a single
 * structured JSON line for SOC / compliance ingestion. Captures the actor, tenant,
 * order, amount and outcome of every settlement-triggering action. Never throws.
 */
function auditPayment(req, type, fields = {}) {
    try {
        const actorId = (req && req.auth && req.auth.userId) || 'unknown';
        const tenantId = (req && req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
        const rec = {
            audit: true, type, decision: 'allow', ts: new Date().toISOString(),
            actorId, tenantId, roles: (req && req.auth && req.auth.roles) || [], ...fields,
        };
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(rec));
    } catch { /* audit must never break the request */ }
}

module.exports = { auditPayment };
