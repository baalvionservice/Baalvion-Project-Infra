'use strict';
// Logistics Core Foundation (Phase 4) — thin wrapper over utils/audit.js's
// recordAudit for the logistics controllers (container/package/address/
// tracking/warehouse/fleet/charge/incident/return), none of which called it
// before this phase. Reduces each call site to one line instead of
// re-deriving actorId/tenantId inline at every mutation (12 controllers x
// 3-6 actions each).
const { recordAudit } = require('./audit');

/**
 * @param {import('express').Request} req
 * @param {string} action - `<resourceType>.<verb>`, e.g. 'container.created'
 * @param {string} resourceType
 * @param {string} resourceId
 * @param {object} [metadata]
 */
function auditLogistics(req, action, resourceType, resourceId, metadata = {}) {
    const actorId = (req.auth && (req.auth.userId || req.auth.email)) || 'system';
    const tenantId = (req.auth && (req.auth.tenantId || req.auth.orgId)) || 'T-DEMO';
    return recordAudit({ actorId, action, resourceType, resourceId, tenantId, metadata });
}

module.exports = { auditLogistics };
