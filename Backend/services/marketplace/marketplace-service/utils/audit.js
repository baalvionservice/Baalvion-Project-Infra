'use strict';
/**
 * Deal-room audit trail → durable outbox → audit-service (hash-chained, tamper-evident).
 *
 * In a negotiation the log IS the product: who unlocked what, who moved the terms, who released
 * the money. Every state-changing action — and every refused one — records the acting user AND
 * their org, because attribution to a person without their side of the table is not evidence.
 *
 * Delivery is at-least-once, not best-effort. Events are written to marketplace.audit_outbox
 * first and drained by service/auditRelay.js, so an audit-service outage delays the trail rather
 * than shredding it. The write deliberately runs OUTSIDE the request's tenant transaction (via
 * the un-routed query exposed by middleware/tenantConnection) for two reasons: it must survive a
 * request that later rolls back, and the outbox is not tenant-scoped — an actor's own RLS context
 * must not be able to hide their own trail.
 */
const db = require('../models');
const { recordDenied, recordDataRoomOp } = require('../middleware/metrics');

const INSERT = `INSERT INTO marketplace.audit_outbox (payload) VALUES ($payload::jsonb)`;

/**
 * @param {object} e
 * @param {string} e.action        dotted verb, e.g. 'deal.nda.signed'
 * @param {object} [e.user]        req.user — supplies actorId + orgId/tenantId
 * @param {string} [e.dealId]      the deal the action belongs to
 * @param {string} [e.resourceType]
 * @param {string} [e.resourceId]
 * @param {string} [e.outcome]     success | deny | failure
 * @param {string} [e.severity]    info | low | medium | high | critical
 * @param {object} [e.metadata]
 */
function record(e) {
    const payload = {
        action: e.action,
        actorId: e.user?.id ? String(e.user.id).slice(0, 64) : undefined,
        orgId: e.user?.orgId || undefined,
        tenantId: e.user?.orgId || undefined,
        resourceType: e.resourceType || 'deal',
        resourceId: e.resourceId || e.dealId || undefined,
        scopeId: e.dealId || undefined,
        outcome: e.outcome || 'success',
        severity: e.severity || 'info',
        sourceService: 'marketplace-service',
        occurredAt: new Date().toISOString(),
        metadata: e.metadata || {},
    };

    // A refusal is the signal worth alerting on, so it increments a counter as well as being
    // written to the trail. Done HERE, at the single place every event passes through, rather
    // than at each call site where it would eventually be forgotten.
    if (payload.outcome === 'deny') recordDenied(payload.action, payload.severity);
    if (payload.action === 'deal.document.uploaded') recordDataRoomOp('upload');
    if (payload.action === 'deal.document.downloaded') recordDataRoomOp('download');

    // Un-routed so it does not join (and cannot be rolled back with) the request transaction.
    const query = db.sequelize.__origQuery || db.sequelize.query.bind(db.sequelize);
    return query(INSERT, { bind: { payload: JSON.stringify(payload) } })
        .catch((err) => {
            // Losing the trail is worse than losing the request — say so loudly, with the event.
            console.error(`[Marketplace] AUDIT ENQUEUE FAILED ${payload.action} — ${err.message}`, JSON.stringify(payload));
        });
}

module.exports = { record };
