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

    async listActive(userId) {
        return db.Session.findAll({
            where:  { user_id: userId, revoked_at: null },
            order:  [['last_seen_at', 'DESC']],
        });
    }
}

module.exports = new SessionRepository();
