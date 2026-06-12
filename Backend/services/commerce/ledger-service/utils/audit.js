'use strict';
/**
 * War Room 3 — immutable money-movement audit for the ledger.
 *
 * Emits the platform audit contract { audit, type, decision, ts, ... } as a single
 * structured JSON line to stdout so SOC / compliance tooling ingests every ledger
 * write through one schema. Captures who / when / what / before / after / reason.
 * Never throws — an audit failure must never break the underlying business action.
 *
 * NOTE: a dedicated append-only AuditLog table (see trade-service utils/audit.js for
 * the hash-chained reference) is the recommended hardening; this structured-log
 * emitter is the immediate control and is forwarded to the central audit pipeline.
 */
function auditLedger(req, type, fields = {}) {
    try {
        const actorId = (req && req.user && req.user.sub) || 'unknown';
        const tenantId = (req && req.user && req.user.tenantId) || null;
        const rec = {
            audit: true,
            type,
            decision: 'allow',
            ts: new Date().toISOString(),
            actorId,
            tenantId,
            isService: !!(req && req.user && req.user.isService),
            ...fields,
        };
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(rec));
    } catch { /* audit must never break the request */ }
}

module.exports = { auditLedger };
