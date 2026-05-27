'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

exports.listDisputes = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        const p = paginate(page, limit);
        const { rows, count } = await db.Dispute.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.fileDispute = async (req, res, next) => {
    try {
        const { campaign_id, creator_id, brand_id, deliverable_id, category, reason, proposed_resolution, evidence_urls } = req.body;
        if (!reason) return next(new AppError('VALIDATION', 'reason is required', 400));
        const dispute = await db.Dispute.create({
            campaign_id, creator_id, brand_id, deliverable_id,
            category, reason, proposed_resolution,
            evidence_urls: evidence_urls || [],
            status: 'filed',
        });
        await db.SystemLog.create({
            org_id: req.user.orgId,
            event: 'dispute_filed',
            message: `Dispute filed by user ${req.user.id}`,
            metadata: { dispute_id: dispute.id, category },
        });
        return sendSuccess(req, res, dispute, 201);
    } catch (err) { return next(err); }
};

exports.updateDispute = async (req, res, next) => {
    try {
        const roles = (req.auth && req.auth.roles) || [];
        if (!roles.some((r) => ['admin', 'owner', 'super_admin'].includes(r))) return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        const dispute = await db.Dispute.findByPk(req.params.id);
        if (!dispute) return next(new AppError('NOT_FOUND', 'Dispute not found', 404));
        const allowed = ['status', 'admin_notes', 'proposed_resolution'];
        const updates = {};
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
        await dispute.update(updates);
        await db.SystemLog.create({
            org_id: req.user.orgId,
            event: 'dispute_updated',
            message: `Dispute ${dispute.id} updated by admin ${req.user.id}`,
            metadata: { dispute_id: dispute.id, updates },
        });
        return sendSuccess(req, res, dispute);
    } catch (err) { return next(err); }
};
