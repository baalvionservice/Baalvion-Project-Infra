'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

exports.listProposals = async (req, res, next) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const where = { org_id: req.user.orgId };
        if (status) where.status = status;
        if (search) where.company_name = { [Op.iLike]: `%${search}%` };
        const p = paginate(page, limit);
        const { rows, count } = await db.Proposal.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.getProposal = async (req, res, next) => {
    try {
        const proposal = await db.Proposal.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!proposal) return next(new AppError('NOT_FOUND', 'Proposal not found', 404));
        return sendSuccess(req, res, proposal);
    } catch (err) { return next(err); }
};

exports.createProposal = async (req, res, next) => {
    try {
        const { dealId, company_name, total_price, deliverables, pricing_breakdown, notes } = req.body;
        if (!dealId) return next(new AppError('VALIDATION', 'dealId is required', 400));
        const deal = await db.Deal.findOne({ where: { id: dealId, org_id: req.user.orgId } });
        if (!deal) return next(new AppError('NOT_FOUND', 'Deal not found', 404));
        const proposal = await db.Proposal.create({
            deal_id: dealId,
            company_name: company_name || deal.company_name,
            total_price: total_price || 0,
            deliverables: deliverables || [],
            pricing_breakdown: pricing_breakdown || {},
            notes,
            status: 'draft',
            org_id: req.user.orgId,
        });
        return sendSuccess(req, res, proposal, 201);
    } catch (err) { return next(err); }
};

exports.updateProposal = async (req, res, next) => {
    try {
        const proposal = await db.Proposal.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!proposal) return next(new AppError('NOT_FOUND', 'Proposal not found', 404));
        const allowed = ['company_name', 'total_price', 'deliverables', 'pricing_breakdown', 'notes'];
        const updates = {};
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
        await proposal.update(updates);
        return sendSuccess(req, res, proposal);
    } catch (err) { return next(err); }
};

exports.sendProposal = async (req, res, next) => {
    try {
        const proposal = await db.Proposal.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!proposal) return next(new AppError('NOT_FOUND', 'Proposal not found', 404));
        if (proposal.status !== 'draft') return next(new AppError('INVALID_STATE', 'Only draft proposals can be sent', 400));
        await proposal.update({ status: 'sent' });
        return sendSuccess(req, res, proposal);
    } catch (err) { return next(err); }
};

exports.approveProposal = async (req, res, next) => {
    try {
        const proposal = await db.Proposal.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!proposal) return next(new AppError('NOT_FOUND', 'Proposal not found', 404));
        await proposal.update({ status: 'approved' });
        return sendSuccess(req, res, proposal);
    } catch (err) { return next(err); }
};

exports.rejectProposal = async (req, res, next) => {
    try {
        const proposal = await db.Proposal.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!proposal) return next(new AppError('NOT_FOUND', 'Proposal not found', 404));
        await proposal.update({ status: 'rejected' });
        return sendSuccess(req, res, proposal);
    } catch (err) { return next(err); }
};
