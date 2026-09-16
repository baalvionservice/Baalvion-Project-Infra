'use strict';
const crypto = require('node:crypto');
const db = require('../models');
const config = require('../config/appConfig');

/**
 * Append-only audit trail for moderation and administrative acts.
 *
 * The client IP and user agent are stored as keyed HMACs, never in the clear. That keeps
 * the log useful for the question it actually needs to answer — "did these actions come
 * from one place?" — while leaving no address on record. With no AUDIT_HASH_SECRET
 * configured the values are dropped entirely rather than written unsalted, because an
 * unsalted IP hash is reversible by brute force over the whole address space.
 */
const hash = (value) => {
    if (!value || !config.security.auditHashSecret) return null;
    return crypto.createHmac('sha256', config.security.auditHashSecret).update(String(value)).digest('hex').slice(0, 32);
};

/**
 * Writing the trail must never break the operation it is recording, but a silent failure
 * would be worse: the error is logged with the request id so a gap in the trail is
 * traceable rather than invisible.
 */
async function record(req, { action, entityType = null, entityId = null, metadata = {} }) {
    const actor = req.actor || {};
    try {
        return await db.AuditLog.create({
            actor_id: actor.userId || null,
            actor_roles: actor.roles || [],
            action,
            entity_type: entityType,
            entity_id: entityId,
            request_id: req.requestId || null,
            ip_hash: hash(req.ip),
            user_agent_hash: hash(req.headers['user-agent']),
            metadata,
        });
    } catch (err) {
        console.error('[canwemarry] audit write failed', { requestId: req.requestId, action, message: err.message });
        return null;
    }
}

async function list({ page, pageSize, actorId, entityType, action }) {
    const where = {};
    if (actorId) where.actor_id = actorId;
    if (entityType) where.entity_type = entityType;
    if (action) where.action = action;

    const { rows, count } = await db.AuditLog.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return {
        items: rows.map((r) => ({
            id: r.id,
            actorId: r.actor_id,
            actorRoles: r.actor_roles,
            action: r.action,
            entityType: r.entity_type,
            entityId: r.entity_id,
            requestId: r.request_id,
            metadata: r.metadata,
            createdAt: r.created_at,
        })),
        total: count,
    };
}

module.exports = { record, list };
