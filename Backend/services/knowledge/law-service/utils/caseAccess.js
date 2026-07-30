'use strict';
const db = require('../models');
const { AppError } = require('./errors');

/**
 * Loads a case and enforces the same ownership rule already used by
 * caseController.js: admins can access any case; otherwise the caller must be
 * the owning client or the assigned lawyer. Shared by the notes/tasks/
 * time-log sub-resource controllers so the rule can't drift between them.
 */
async function loadOwnedCase(req) {
    const legalCase = await db.Case.findByPk(req.params.id, {
        include: [
            { model: db.Client, as: 'client', attributes: ['id', 'user_id'] },
            { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'user_id'], required: false },
        ],
    });
    if (!legalCase) return { error: new AppError('NOT_FOUND', 'Case not found', 404) };
    if (!req.user.isAdmin) {
        const uid = String(req.user.id);
        const isOwner =
            (legalCase.client && String(legalCase.client.user_id) === uid) ||
            (legalCase.lawyer && String(legalCase.lawyer.user_id) === uid);
        if (!isOwner) return { error: new AppError('FORBIDDEN', 'Not authorised for this case', 403) };
    }
    return { legalCase };
}

module.exports = { loadOwnedCase };
