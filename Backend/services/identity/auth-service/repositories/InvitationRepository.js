'use strict';
const db = require('../models');

class InvitationRepository {
    async findByHash(tokenHash) {
        return db.Invitation.findOne({ where: { token_hash: tokenHash } });
    }

    async findPendingByHash(tokenHash) {
        return db.Invitation.findOne({ where: { token_hash: tokenHash, accepted_at: null } });
    }

    async create({ orgId, email, role, tokenHash, expiresAt, createdBy }) {
        return db.Invitation.create({
            org_id:     orgId,
            email:      email.toLowerCase().trim(),
            role,
            token_hash: tokenHash,
            expires_at: expiresAt,
            created_by: createdBy,
        });
    }

    /** Removes any pending invitations for the same email + org before issuing a new one. */
    async destroyPending(orgId, email) {
        return db.Invitation.destroy({
            where: { org_id: orgId, email: email.toLowerCase().trim(), accepted_at: null },
        });
    }

    async markAccepted(id) {
        return db.Invitation.update({ accepted_at: new Date() }, { where: { id } });
    }
}

module.exports = new InvitationRepository();
