'use strict';
const db = require('../models');

class UserRepository {
    async findByEmail(email) {
        return db.User.findOne({ where: { email: email.toLowerCase().trim() } });
    }

    async findById(id) {
        return db.User.findByPk(id);
    }

    async create({ email, passwordHash, fullName, firstName, lastName }) {
        const first = firstName ? String(firstName).trim() : null;
        const last  = lastName  ? String(lastName).trim()  : null;
        // full_name stays the canonical display value (every downstream presenter reads it). When
        // first/last are supplied, derive it from them; otherwise keep an explicit fullName.
        const combined = [first, last].filter(Boolean).join(' ');
        return db.User.create({
            email:         email.toLowerCase().trim(),
            password_hash: passwordHash,
            full_name:     combined || fullName || null,
            first_name:    first,
            last_name:     last,
            status:        'active',
        });
    }

    /** Backfill names on an existing account that has none yet (never overwrites a set name). */
    async setNamesIfMissing(userId, { firstName, lastName }) {
        const first = firstName ? String(firstName).trim() : null;
        const last  = lastName  ? String(lastName).trim()  : null;
        if (!first && !last) return false;
        const combined = [first, last].filter(Boolean).join(' ');
        const [affected] = await db.User.update(
            { first_name: first, last_name: last, full_name: combined || null },
            { where: { id: userId, full_name: null } },
        );
        return affected > 0;
    }

    async update(id, fields) {
        const [affected] = await db.User.update(fields, { where: { id } });
        return affected > 0;
    }

    async setEmailVerified(userId) {
        return db.User.update({ email_verified_at: new Date() }, { where: { id: userId } });
    }

    // ── Phone verification ─────────────────────────────────────────────────────────

    async findByPhone(phone) {
        return db.User.findOne({ where: { phone: String(phone).trim() } });
    }

    /** Set/replace the user's phone number. Does NOT mark it verified (that needs an OTP). */
    async setPhone(userId, phone) {
        return db.User.update({ phone: phone ? String(phone).trim() : null }, { where: { id: userId } });
    }

    /** Stamp phone_verified_at (and persist the confirmed number) after an OTP is confirmed. */
    async setPhoneVerified(userId, phone) {
        const fields = { phone_verified_at: new Date() };
        if (phone) fields.phone = String(phone).trim();
        return db.User.update(fields, { where: { id: userId } });
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

    // ── Lifecycle ────────────────────────────────────────────────────────────────

    async setLastLogin(userId) {
        return db.User.update({ last_login_at: new Date() }, { where: { id: userId } });
    }

    async setStatus(userId, status) {
        return db.User.update({ status }, { where: { id: userId } });
    }

    async setMfaRequired(userId, required) {
        return db.User.update({ mfa_required: !!required }, { where: { id: userId } });
    }
}

module.exports = new UserRepository();
