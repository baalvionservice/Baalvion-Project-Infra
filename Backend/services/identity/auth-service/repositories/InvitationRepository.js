'use strict';
const db = require('../models');

class InvitationRepository {
    async findByHash(tokenHash) {
        return db.Invitation.findOne({ where: { token_hash: tokenHash } });
    }

    async findPendingByHash(tokenHash) {
        // Pending = not yet accepted AND not revoked.
        return db.Invitation.findOne({ where: { token_hash: tokenHash, accepted_at: null, revoked_at: null } });
    }

    async findById(id) {
        return db.Invitation.findByPk(id);
    }

    async create({ orgId, email, role, tokenHash, expiresAt, createdBy, fullName = null }) {
        return db.Invitation.create({
            org_id:     orgId,
            email:      email.toLowerCase().trim(),
            role,
            token_hash: tokenHash,
            expires_at: expiresAt,
            created_by: createdBy,
            full_name:  fullName,
        });
    }

    /** Removes any pending invitations for the same email + org before issuing a new one. */
    async destroyPending(orgId, email) {
        return db.Invitation.destroy({
            where: { org_id: orgId, email: email.toLowerCase().trim(), accepted_at: null },
        });
    }

    /** Lists pending (unaccepted, unrevoked) invitations for an org. */
    async listPending(orgId) {
        return db.Invitation.findAll({
            where: { org_id: orgId, accepted_at: null, revoked_at: null },
            order: [['created_at', 'DESC']],
        });
    }

    /** Soft-revokes a pending invitation (keeps the audit trail). */
    async revoke(id) {
        return db.Invitation.update({ revoked_at: new Date() }, { where: { id, accepted_at: null } });
    }

    /** Re-issues token + expiry on an existing pending invitation (resend). */
    async refreshToken(id, tokenHash, expiresAt) {
        return db.Invitation.update({ token_hash: tokenHash, expires_at: expiresAt, revoked_at: null }, { where: { id } });
    }

    async markAccepted(id) {
        return db.Invitation.update({ accepted_at: new Date() }, { where: { id } });
    }
}

module.exports = new InvitationRepository();
