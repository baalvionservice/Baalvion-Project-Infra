'use strict';
const crypto = require('crypto');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { isCompanyEmail } = require('../utils/email');

// Human-friendly, collision-resistant reference, e.g. "BV-7F3A9C".
const genReference = () => `BV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// Minutes an approved applicant must wait before the deal room unlocks (cool-down from approval).
const DEAL_ROOM_COOLDOWN_MINUTES = Math.max(
    0,
    Number(process.env.IR_DEAL_ROOM_COOLDOWN_MINUTES || 5),
);

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

// Deal-room eligibility for a given email. The three gates the product requires:
//   1. the email belongs to an APPROVED application,
//   2. the email is a corporate (non-free) address, and
//   3. at least DEAL_ROOM_COOLDOWN_MINUTES have elapsed since approval.
// Returns a flat, PII-free shape — the caller (a server-side BFF) only ever passes the
// signed-in user's own email, so this leaks nothing the requester doesn't already own.
const getEligibilityByEmail = async (orgId, rawEmail) => {
    const email = String(rawEmail || '').trim().toLowerCase();
    const companyEmail = isCompanyEmail(email);
    const base = {
        eligible: false,
        reason: 'NO_APPLICATION',
        status: null,
        companyEmail,
        approvedAt: null,
        dealRoomUnlocksAt: null,
        cooldownMinutes: DEAL_ROOM_COOLDOWN_MINUTES,
    };

    if (!email) return { ...base, reason: 'INVALID_EMAIL' };

    // Latest application for this email (an applicant may have re-applied).
    const application = await db.IrInvestorApplication.findOne({
        where: { org_id: orgId, email },
        order: [['created_at', 'DESC']],
    });
    if (!application) return base;

    const out = { ...base, status: application.status };

    if (application.status === 'pending') return { ...out, reason: 'PENDING_REVIEW' };
    if (application.status !== 'approved') return { ...out, reason: 'REJECTED' };

    // Approved from here on.
    if (!companyEmail) return { ...out, reason: 'PERSONAL_EMAIL' };

    const approvedAt = application.reviewed_at || application.updated_at;
    const unlocksAt = new Date(new Date(approvedAt).getTime() + DEAL_ROOM_COOLDOWN_MINUTES * 60_000);
    const approvedIso = approvedAt ? new Date(approvedAt).toISOString() : null;

    if (Date.now() < unlocksAt.getTime()) {
        return { ...out, reason: 'COOLDOWN', approvedAt: approvedIso, dealRoomUnlocksAt: unlocksAt.toISOString() };
    }
    return { ...out, eligible: true, reason: 'OK', approvedAt: approvedIso, dealRoomUnlocksAt: unlocksAt.toISOString() };
};

module.exports = { listApplications, createApplication, getApplication, reviewApplication, getEligibilityByEmail };
