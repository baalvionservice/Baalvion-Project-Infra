'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

exports.listPayments = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const where = { org_id: req.user.orgId };
        if (status) where.status = status;
        const p = paginate(page, limit);
        const { rows, count } = await db.Payment.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.getPayment = async (req, res, next) => {
    try {
        const payment = await db.Payment.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!payment) return next(new AppError('NOT_FOUND', 'Payment not found', 404));
        return sendSuccess(req, res, payment);
    } catch (err) { return next(err); }
};

exports.createPayment = async (req, res, next) => {
    try {
        const { proposalId, amount, companyName } = req.body;
        if (!amount) return next(new AppError('VALIDATION', 'amount is required', 400));
        let deal_id = null;
        let resolvedCompanyName = companyName;
        if (proposalId) {
            const proposal = await db.Proposal.findOne({ where: { id: proposalId, org_id: req.user.orgId } });
            if (!proposal) return next(new AppError('NOT_FOUND', 'Proposal not found', 404));
            deal_id = proposal.deal_id;
            resolvedCompanyName = resolvedCompanyName || proposal.company_name;
        }
        const payment = await db.Payment.create({
            proposal_id: proposalId || null,
            deal_id,
            company_name: resolvedCompanyName || 'Unknown',
            amount,
            status: 'pending',
            org_id: req.user.orgId,
        });
        return sendSuccess(req, res, payment, 201);
    } catch (err) { return next(err); }
};

exports.markPaid = async (req, res, next) => {
    try {
        const payment = await db.Payment.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!payment) return next(new AppError('NOT_FOUND', 'Payment not found', 404));
        const { method } = req.body;
        await payment.update({ status: 'paid', method: method || 'card', transaction_id: uuidv4() });
        return sendSuccess(req, res, payment);
    } catch (err) { return next(err); }
};

exports.moveToEscrow = async (req, res, next) => {
    try {
        const payment = await db.Payment.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!payment) return next(new AppError('NOT_FOUND', 'Payment not found', 404));
        if (payment.status !== 'paid') return next(new AppError('INVALID_STATE', 'Only paid payments can move to escrow', 400));
        await payment.update({ status: 'escrow' });
        return sendSuccess(req, res, payment);
    } catch (err) { return next(err); }
};

exports.releaseEscrow = async (req, res, next) => {
    try {
        const payment = await db.Payment.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!payment) return next(new AppError('NOT_FOUND', 'Payment not found', 404));
        if (payment.status !== 'escrow') return next(new AppError('INVALID_STATE', 'Only escrow payments can be released', 400));
        await payment.update({ status: 'released' });
        return sendSuccess(req, res, payment);
    } catch (err) { return next(err); }
};
