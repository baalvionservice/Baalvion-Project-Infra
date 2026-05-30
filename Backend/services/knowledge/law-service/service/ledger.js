'use strict';
// Lawyer earnings ledger + payout settlement.
//   • creditFromPayment(payment)  — idempotent: one CREDIT per succeeded payment,
//     net of the platform fee. Called from the payment "settled" hook.
//   • getBalance(lawyerId)        — lifetime / paid-out / pending / available.
//   • requestPayout / processPayout — lawyer requests, admin (or Razorpay Payouts
//     in production) settles; a settled payout writes a DEBIT ledger row.
const db = require('../models');
const mailer = require('./mailer');
const { splitFee, round2 } = require('../utils/money');

const FEE_PERCENT = Math.max(0, Math.min(100, Number(process.env.PLATFORM_FEE_PERCENT || 15)));

const num = (v) => Number(v || 0);

/** Platform fee + lawyer-net split for a gross amount (uses the configured fee). */
function split(amount) {
    return splitFee(amount, FEE_PERCENT);
}

/** Idempotently credit a lawyer's ledger from a succeeded payment. */
async function creditFromPayment(payment) {
    if (!payment || payment.status !== 'succeeded' || !payment.lawyer_id) return null;
    const existing = await db.LawyerLedger.findOne({
        where: { payment_id: payment.id, entry_type: 'credit' },
    });
    if (existing) return existing; // already credited
    const { fee, net } = split(payment.amount);
    return db.LawyerLedger.create({
        lawyer_id: payment.lawyer_id,
        payment_id: payment.id,
        entry_type: 'credit',
        amount: net,
        fee_amount: fee,
        currency: payment.currency || 'USD',
        description: payment.booking_id ? `Earnings — booking #${payment.booking_id}` : 'Earnings',
    });
}

/** Balance summary for a lawyer. */
async function getBalance(lawyerId) {
    const [credits, paidOut, pending] = await Promise.all([
        db.LawyerLedger.sum('amount', { where: { lawyer_id: lawyerId, entry_type: 'credit' } }),
        db.Payout.sum('amount', { where: { lawyer_id: lawyerId, status: 'paid' } }),
        db.Payout.sum('amount', { where: { lawyer_id: lawyerId, status: ['requested', 'processing'] } }),
    ]);
    const lifetime = round2(num(credits));
    const paid = round2(num(paidOut));
    const pendingAmt = round2(num(pending));
    return {
        lifetimeEarnings: lifetime,
        paidOut: paid,
        pendingPayouts: pendingAmt,
        available: round2(lifetime - paid - pendingAmt),
        currency: 'USD',
        feePercent: FEE_PERCENT,
    };
}

async function getLedger(lawyerId, limit = 50) {
    return db.LawyerLedger.findAll({
        where: { lawyer_id: lawyerId },
        order: [['created_at', 'DESC']],
        limit,
    });
}

async function listPayouts(lawyerId, limit = 50) {
    const where = lawyerId ? { lawyer_id: lawyerId } : {};
    return db.Payout.findAll({ where, order: [['created_at', 'DESC']], limit });
}

/** A lawyer requests a payout of their available balance (or part of it). */
async function requestPayout(lawyerId, amount, method = 'bank_transfer') {
    const bal = await getBalance(lawyerId);
    const amt = round2(num(amount) || bal.available);
    if (amt <= 0) { const e = new Error('No funds available to withdraw'); e.code = 'NO_FUNDS'; throw e; }
    if (amt > bal.available) { const e = new Error('Requested amount exceeds available balance'); e.code = 'INSUFFICIENT_FUNDS'; throw e; }
    return db.Payout.create({ lawyer_id: lawyerId, amount: amt, currency: bal.currency, method, status: 'requested' });
}

/**
 * Settle a payout (admin / gateway). On 'paid' it writes a DEBIT ledger row
 * (idempotent) and emails the lawyer. Until Razorpay Payouts keys are wired in
 * production this is the simulated settlement path.
 */
async function processPayout(payoutId, { status = 'paid', reference, notes } = {}) {
    const payout = await db.Payout.findByPk(payoutId);
    if (!payout) { const e = new Error('Payout not found'); e.code = 'NOT_FOUND'; throw e; }
    if (payout.status === 'paid') return payout; // idempotent

    await payout.update({
        status,
        reference: reference || payout.reference,
        notes: notes || payout.notes,
        processed_at: new Date(),
    });

    if (status === 'paid') {
        // Debit the ledger once for this payout.
        const existing = await db.LawyerLedger.findOne({ where: { payout_id: payout.id, entry_type: 'debit' } });
        if (!existing) {
            await db.LawyerLedger.create({
                lawyer_id: payout.lawyer_id,
                payout_id: payout.id,
                entry_type: 'debit',
                amount: payout.amount,
                currency: payout.currency,
                description: 'Payout',
            });
        }
        try {
            const lawyer = await db.Lawyer.findByPk(payout.lawyer_id, { attributes: ['name', 'email'] });
            if (lawyer && lawyer.email) {
                mailer.sendTemplate('payoutProcessed', lawyer.email, {
                    name: lawyer.name, amount: payout.amount, currency: payout.currency,
                    reference: payout.reference || `PO-${payout.id}`,
                }).catch(() => {});
            }
        } catch (_) { /* email best-effort */ }
    }
    return payout;
}

module.exports = { creditFromPayment, getBalance, getLedger, listPayouts, requestPayout, processPayout, split, FEE_PERCENT };
