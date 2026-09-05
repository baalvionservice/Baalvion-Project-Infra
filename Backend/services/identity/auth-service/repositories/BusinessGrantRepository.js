'use strict';
const db = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Per-business access grants (auth.business_grants).
 *
 * Raw SQL rather than a Sequelize model: the table is written by admin-service and read here
 * on every token mint, so the two only need to agree on columns — not on a shared model
 * definition that would have to be kept in step across services.
 *
 * "Live" means not revoked and not expired. Expiry is evaluated in SQL so a lapsed grant can
 * never be handed out in a token just because a background sweep has not run yet.
 */
class BusinessGrantRepository {
    /** Live grants for one person, as [{ business, role, expiresAt }]. */
    async listLiveForUser(userId) {
        if (userId == null) return [];
        return db.sequelize.query(
            `SELECT business, role, expires_at AS "expiresAt"
               FROM auth.business_grants
              WHERE user_id = :userId
                AND revoked_at IS NULL
                AND (expires_at IS NULL OR expires_at > NOW())
              ORDER BY business`,
            { type: QueryTypes.SELECT, replacements: { userId } },
        );
    }
}

module.exports = new BusinessGrantRepository();
