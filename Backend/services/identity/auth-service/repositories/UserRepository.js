'use strict';
const db = require('../models');

class UserRepository {
    async findByEmail(email) {
        return db.User.findOne({ where: { email: email.toLowerCase().trim() } });
    }

    async findById(id) {
        return db.User.findByPk(id);
    }

    async create({ email, passwordHash, fullName }) {
        return db.User.create({
            email:         email.toLowerCase().trim(),
            password_hash: passwordHash,
            full_name:     fullName || null,
            status:        'active',
        });
    }

    async update(id, fields) {
        const [affected] = await db.User.update(fields, { where: { id } });
        return affected > 0;
    }

    async setEmailVerified(userId) {
        return db.User.update({ email_verified_at: new Date() }, { where: { id: userId } });
    }

    async setPasswordHash(userId, passwordHash) {
        return db.User.update({ password_hash: passwordHash }, { where: { id: userId } });
    }

    async updateMfa(userId, { pendingSecret = null, secret = null, enabled = false, recoveryCodes = [] } = {}) {
        return db.User.update({
            mfa_pending_secret: pendingSecret,
            mfa_secret:         secret,
            mfa_enabled:        enabled,
            recovery_codes:     recoveryCodes,
        }, { where: { id: userId } });
    }

    async updateProfile(userId, { fullName, avatarUrl }) {
        const fields = {};
        if (fullName  !== undefined) fields.full_name  = fullName;
        if (avatarUrl !== undefined) fields.avatar_url = avatarUrl;
        const [affected] = await db.User.update(fields, { where: { id: userId } });
        if (!affected) return null;
        return db.User.findByPk(userId);
    }
}

module.exports = new UserRepository();
