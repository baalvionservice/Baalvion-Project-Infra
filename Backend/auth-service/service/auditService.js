const db = require('../models');

async function log({ userId, orgId, action, resourceType, resourceId, metadata, ipAddress }) {
    try {
        await db.AuditLog.create({
            user_id: userId || null,
            org_id: orgId || null,
            action,
            resource_type: resourceType || null,
            resource_id: resourceId ? String(resourceId) : null,
            metadata: metadata || {},
            ip_address: ipAddress || null,
        });
    } catch (err) {
        console.warn('[Audit] Failed to write audit log:', err.message);
    }
}

module.exports = { log };
