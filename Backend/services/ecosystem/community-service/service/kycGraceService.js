'use strict';
const db = require('../models');

const GRACE_DAYS = Number(process.env.KYC_GRACE_DAYS || 7);
const { evaluate, DAY } = require('../utils/kycWindow');

async function statusFor(userId, exempt) {
    const uid = String(userId);
    const [row] = await db.KycGrace.findOrCreate({ where: { user_id: uid }, defaults: { user_id: uid, deadline_at: new Date(Date.now() + GRACE_DAYS * DAY) } });
    const kyc = await db.KycVerification.findOne({ where: { user_id: uid }, attributes: ['status'] });
    const out = evaluate({ deadlineAt: row.deadline_at, rowState: row.state, kycStatus: kyc ? kyc.status : null, exempt });
    if (out.state === 'blocked' && row.state !== 'blocked') await row.update({ state: 'blocked', blocked_at: new Date() });
    return { ...out, deadlineAt: row.deadline_at, graceDays: GRACE_DAYS, kyc: kyc ? kyc.status : null };
}

// Called when the team approves a "request access again": a fresh window.
async function reopen(userId) {
    const uid = String(userId);
    const [row] = await db.KycGrace.findOrCreate({ where: { user_id: uid }, defaults: { user_id: uid, deadline_at: new Date(Date.now() + GRACE_DAYS * DAY) } });
    await row.update({ state: 'open', blocked_at: null, deadline_at: new Date(Date.now() + GRACE_DAYS * DAY), renewals: row.renewals + 1 });
    return row;
}

module.exports = { statusFor, reopen, GRACE_DAYS };
