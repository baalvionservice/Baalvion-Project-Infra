'use strict';
const db = require('../models');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class SessionRepository {
    async create({ userId, orgId, ipAddress, userAgent }) {
        return db.Session.create({
            user_id:     userId,
            org_id:      orgId || null,
            ip_address:  ipAddress || null,
            user_agent:  userAgent  || null,
            expires_at:  new Date(Date.now() + SESSION_TTL_MS),
            last_seen_at: new Date(),
        });
    }

    async findById(id) {
        return db.Session.findByPk(id);
    }

    async findActiveById(id) {
        return db.Session.findOne({ where: { id, revoked_at: null } });
    }

    async touch(id) {
        return db.Session.update({ last_seen_at: new Date() }, { where: { id } });
    }

    async revoke(id) {
        return db.Session.update({ revoked_at: new Date() }, { where: { id, revoked_at: null } });
    }

    async revokeAllForUser(userId) {
        return db.Session.update({ revoked_at: new Date() }, { where: { user_id: userId, revoked_at: null } });
    }

    /**
     * Revokes every active session BOUND TO a given org (org_id match). Returns the list
     * of revoked session ids so the caller can also revoke their refresh tokens.
     * Org-scoped on purpose: a user who belongs to multiple orgs keeps their sessions in
     * the other (non-suspended) orgs.
     */
    async revokeByOrg(orgId) {
        const sessions = await db.Session.findAll({ where: { org_id: orgId, revoked_at: null }, attributes: ['id'] });
        const ids = sessions.map((s) => s.id);
        if (ids.length) {
            await db.Session.update({ revoked_at: new Date() }, { where: { id: ids } });
        }
        return ids;
    }

    async listActive(userId) {
        return db.Session.findAll({
            where:  { user_id: userId, revoked_at: null },
            order:  [['last_seen_at', 'DESC']],
        });
    }
}

module.exports = new SessionRepository();
