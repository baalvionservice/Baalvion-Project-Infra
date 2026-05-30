'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const ledger = require('../service/ledger');

// Resolve the caller's lawyer profile (payouts belong to lawyers).
async function myLawyer(req) {
    return db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
}

// GET /payouts/balance — the lawyer's earnings summary + recent ledger.
const getMyBalance = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'No lawyer profile for this account', 404));
        const [balance, entries] = await Promise.all([
            ledger.getBalance(lawyer.id),
            ledger.getLedger(lawyer.id, 50),
        ]);
        return sendSuccess(req, res, { balance, ledger: entries });
    } catch (err) { return next(err); }
};

// GET /payouts — lawyer sees own; admin sees all (optional ?lawyer_id=).
const listPayouts = async (req, res, next) => {
    try {
        if (req.user.isAdmin) {
            const lawyerId = req.query.lawyer_id ? Number(req.query.lawyer_id) : null;
            const rows = await ledger.listPayouts(lawyerId, 200);
            return sendSuccess(req, res, rows);
        }
        const lawyer = await myLawyer(req);
        if (!lawyer) return sendSuccess(req, res, []);
        const rows = await ledger.listPayouts(lawyer.id, 100);
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

// POST /payouts — lawyer requests a withdrawal of (part of) their available balance.
const requestPayout = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'No lawyer profile for this account', 404));
        const { amount, method } = req.body || {};
        const payout = await ledger.requestPayout(lawyer.id, amount, method);
        return sendSuccess(req, res, payout, 201);
    } catch (err) {
        if (err.code === 'NO_FUNDS' || err.code === 'INSUFFICIENT_FUNDS') {
            return next(new AppError('BAD_REQUEST', err.message, 400));
        }
        return next(err);
    }
};

// POST /payouts/:id/process — admin (or, in prod, Razorpay Payouts) settles a payout.
const processPayout = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const { status = 'paid', reference, notes } = req.body || {};
        const payout = await ledger.processPayout(Number(req.params.id), { status, reference, notes });
        return sendSuccess(req, res, payout);
    } catch (err) {
        if (err.code === 'NOT_FOUND') return next(new AppError('NOT_FOUND', err.message, 404));
        return next(err);
    }
};

module.exports = { getMyBalance, listPayouts, requestPayout, processPayout };
