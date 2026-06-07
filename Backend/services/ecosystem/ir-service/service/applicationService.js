'use strict';
const crypto = require('crypto');
const db = require('../models');
const { AppError } = require('../utils/errors');

// Human-friendly, collision-resistant reference, e.g. "BV-7F3A9C".
const genReference = () => `BV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const listApplications = async (orgId, { page, limit, status }) => {
    const offset = (page - 1) * limit;
    const where = { org_id: orgId };
    if (status) where.status = status;
    const { count, rows } = await db.IrInvestorApplication.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createApplication = async (orgId, data) => {
    // Retry a couple of times in the (very unlikely) event of a reference collision.
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await db.IrInvestorApplication.create({
                ...data,
                org_id: orgId,
                reference: genReference(),
                status: 'pending',
            });
        } catch (err) {
            const isUnique = err?.name === 'SequelizeUniqueConstraintError';
            if (!isUnique || attempt === 2) throw err;
        }
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Could not allocate application reference', 500);
};

const getApplication = async (id, orgId) => {
    const a = await db.IrInvestorApplication.findOne({ where: { id, org_id: orgId } });
    if (!a) throw new AppError('NOT_FOUND', 'Application not found', 404);
    return a;
};

const reviewApplication = async (id, orgId, { action, review_note }, reviewer) => {
    const a = await db.IrInvestorApplication.findOne({ where: { id, org_id: orgId } });
    if (!a) throw new AppError('NOT_FOUND', 'Application not found', 404);
    if (a.status !== 'pending') {
        throw new AppError('CONFLICT', `Application already ${a.status}`, 409);
    }
    await a.update({
        status: action === 'approve' ? 'approved' : 'rejected',
        review_note: review_note || null,
        reviewed_by: reviewer || null,
        reviewed_at: new Date(),
    });
    return a;
};

module.exports = { listApplications, createApplication, getApplication, reviewApplication };
