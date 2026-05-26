'use strict';
const db = require('../models');

class AuditLogRepository {
    /**
     * Writes a structured audit event. Intentionally swallows errors so a
     * failing audit write never bubbles up to break the auth response.
     */
    async append({ userId, orgId, action, resourceType, resourceId, metadata, ipAddress }) {
        try {
            await db.AuditLog.create({
                user_id:       userId       || null,
                org_id:        orgId        || null,
                action,
                resource_type: resourceType || null,
                resource_id:   resourceId != null ? String(resourceId) : null,
                metadata:      metadata    || {},
                ip_address:    ipAddress   || null,
            });
        } catch (err) {
            console.warn('[Audit] write failed:', err.message);
        }
    }

    async findPaginated({ orgId, userId, action, page = 1, limit = 50 }) {
        const where = {};
        if (orgId)  where.org_id  = orgId;
        if (userId) where.user_id = userId;
        if (action) where.action  = action;

        const offset = (page - 1) * limit;
        const { count, rows } = await db.AuditLog.findAndCountAll({
            where,
            order:  [['created_at', 'DESC']],
            limit,
            offset,
        });
        return { total: count, page, limit, items: rows };
    }
}

module.exports = new AuditLogRepository();
