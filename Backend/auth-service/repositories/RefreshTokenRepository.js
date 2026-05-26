'use strict';
/**
 * Refresh token repository with family-based reuse detection.
 *
 * Family semantics
 * ─────────────────
 * Every login creates a new `family_id` (UUID). All refresh tokens issued
 * through rotation within the same login session share that family_id.
 *
 * Reuse detection
 * ────────────────
 * On refresh, the caller looks up the incoming token hash. If the row exists
 * but `revoked_at` is already set, a replay attack (or token theft + race) is
 * detected. The entire family is then revoked and the session is killed.
 *
 * Rows are never deleted — they must be retained so that the presence of a
 * revoked token's family_id can still be queried.
 */
const db = require('../models');

const RT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class RefreshTokenRepository {
    /** Creates a new refresh token record (after signing the JWT). */
    async create({ userId, sessionId, familyId, tokenHash }) {
        return db.RefreshToken.create({
            user_id:    userId,
            session_id: sessionId,
            family_id:  familyId,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + RT_TTL_MS),
        });
    }

    /**
     * Finds a token by hash — returns the row whether revoked or not.
     * Callers MUST check `revoked_at` themselves to implement reuse detection.
     */
    async findByHash(hash) {
        return db.RefreshToken.findOne({ where: { token_hash: hash } });
    }

    async findActiveByHash(hash) {
        return db.RefreshToken.findOne({ where: { token_hash: hash, revoked_at: null } });
    }

    /** Marks a single token as revoked (normal rotation — old token is consumed). */
    async revoke(id) {
        return db.RefreshToken.update({ revoked_at: new Date() }, { where: { id, revoked_at: null } });
    }

    /**
     * Revokes every token in a family.
     * Called immediately on reuse detection to invalidate the entire chain,
     * limiting the attacker's window to zero new rotations.
     */
    async revokeFamily(familyId) {
        return db.RefreshToken.update(
            { revoked_at: new Date() },
            { where: { family_id: familyId, revoked_at: null } }
        );
    }

    /** Revokes all tokens belonging to a session (used on logout). */
    async revokeBySessionId(sessionId) {
        return db.RefreshToken.update(
            { revoked_at: new Date() },
            { where: { session_id: sessionId, revoked_at: null } }
        );
    }

    /** Revokes all tokens for a user (password reset, security wipe). */
    async revokeAllForUser(userId) {
        return db.RefreshToken.update(
            { revoked_at: new Date() },
            { where: { user_id: userId, revoked_at: null } }
        );
    }

    /** Checks whether any active (non-revoked) token exists for a given family. */
    async hasActiveInFamily(familyId) {
        const row = await db.RefreshToken.findOne({ where: { family_id: familyId, revoked_at: null } });
        return row !== null;
    }
}

module.exports = new RefreshTokenRepository();
