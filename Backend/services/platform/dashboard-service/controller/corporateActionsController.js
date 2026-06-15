'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

async function _createAuditLog(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId,
            action,
            entity_type,
            entity_id,
            user_id: req.user.id,
            role: req.user.role,
            resource: req.originalUrl,
            ip_address: req.ip,
            status: 'Success',
            severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

// 'YYYY-MM-DD' from a DATEONLY column (Sequelize returns it as a string already; normalize defensively).
const dateOnly = (v) => (v == null ? null : String(v).slice(0, 10));

exports.get = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;

        const [items, deals] = await Promise.all([
            db.DueDiligenceItem.findAll({ where: { org_id: orgId }, order: [['sort_order', 'ASC']], raw: true }),
            db.CorporateDeal.findAll({ where: { org_id: orgId }, order: [['created_at', 'ASC']], raw: true }),
        ]);

        const dueDiligenceItems = items.map((i) => ({ id: i.item_key, label: i.label }));

        const activeDeals = deals
            .filter((d) => d.status === 'active')
            .map((d) => ({
                id: d.deal_key,
                name: d.name,
                type: d.type,
                stage: d.stage,
                value: d.value,
                started: dateOnly(d.started),
                close: dateOnly(d.close_date),
                owner: d.owner,
            }));

        const completedDeals = deals
            .filter((d) => d.status === 'completed')
            .map((d) => ({
                id: d.deal_key,
                name: d.name,
                type: d.type,
                value: d.value,
                completed: dateOnly(d.completed_date),
                timeline: d.timeline || [],
            }));

        return sendSuccess(req, res, { dueDiligenceItems, activeDeals, completedDeals });
    } catch (err) { return next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { deal_key, name, type, stage, value, owner, started, close_date, completed_date, status, timeline } = req.body;
        if (!deal_key || !name) return next(new AppError('VALIDATION_ERROR', 'deal_key and name are required', 400));
        const deal = await db.CorporateDeal.create({
            org_id: orgId, deal_key, name, type, stage, value, owner, started, close_date, completed_date,
            status: status || 'active', timeline: timeline || [],
        });
        await _createAuditLog(req, 'CREATE_CORPORATE_DEAL', 'corporate_deal', deal_key);
        return sendSuccess(req, res, deal, 201);
    } catch (err) { return next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const deal = await db.CorporateDeal.findOne({ where: { deal_key: req.params.dealKey, org_id: req.user.orgId } });
        if (!deal) return next(new AppError('NOT_FOUND', 'Deal not found', 404));
        const { stage, status } = req.body;
        const patch = {};
        if (stage !== undefined) patch.stage = stage;
        if (status !== undefined) patch.status = status;
        await deal.update(patch);
        await _createAuditLog(req, 'UPDATE_CORPORATE_DEAL', 'corporate_deal', deal.deal_key);
        return sendSuccess(req, res, deal);
    } catch (err) { return next(err); }
};
