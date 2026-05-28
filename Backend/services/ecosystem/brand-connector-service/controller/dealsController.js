'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

exports.listDeals = async (req, res, next) => {
    try {
        const { stage, source, search, page = 1, limit = 20 } = req.query;
        const where = { org_id: req.user.orgId };
        if (stage) where.stage = stage;
        if (source) where.source = source;
        if (search) {
            where.company_name = { [Op.iLike]: `%${search}%` };
        }
        const p = paginate(page, limit);
        const { rows, count } = await db.Deal.findAndCountAll({
            where,
            ...p,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.createDeal = async (req, res, next) => {
    try {
        const { lead_id, company_name, value, stage, assigned_to, source } = req.body;
        if (!company_name) return next(new AppError('VALIDATION', 'company_name is required', 400));
        const deal = await db.Deal.create({
            lead_id, company_name, value, stage, assigned_to,
            source: source || 'manual',
            org_id: req.user.orgId,
        });
        return sendSuccess(req, res, deal, 201);
    } catch (err) { return next(err); }
};

exports.updateDeal = async (req, res, next) => {
    try {
        const deal = await db.Deal.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!deal) return next(new AppError('NOT_FOUND', 'Deal not found', 404));
        const allowed = ['company_name', 'value', 'stage', 'assigned_to', 'source'];
        const updates = {};
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
        await deal.update(updates);
        return sendSuccess(req, res, deal);
    } catch (err) { return next(err); }
};

exports.addNote = async (req, res, next) => {
    try {
        const deal = await db.Deal.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!deal) return next(new AppError('NOT_FOUND', 'Deal not found', 404));
        const { text } = req.body;
        if (!text) return next(new AppError('VALIDATION', 'text is required', 400));
        const note = await db.DealNote.create({ deal_id: deal.id, text });
        return sendSuccess(req, res, note, 201);
    } catch (err) { return next(err); }
};

exports.convertFromReply = async (req, res, next) => {
    try {
        const { messageId } = req.body;
        if (!messageId) return next(new AppError('VALIDATION', 'messageId is required', 400));
        const msg = await db.OutreachMessage.findByPk(messageId);
        if (!msg) return next(new AppError('NOT_FOUND', 'Message not found', 404));
        const lead = msg.lead_id ? await db.Lead.findByPk(msg.lead_id) : null;
        const deal = await db.Deal.create({
            lead_id: msg.lead_id || null,
            company_name: lead ? lead.company_name : (msg.lead_name || 'Unknown'),
            value: 0,
            stage: 'contacted',
            source: 'outreach',
            org_id: req.user.orgId,
        });
        return sendSuccess(req, res, deal, 201);
    } catch (err) { return next(err); }
};
