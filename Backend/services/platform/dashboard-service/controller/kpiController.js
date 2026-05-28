'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

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

exports.listKPIs = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit, business_id } = req.query;
        const where = { org_id: orgId };
        if (business_id) where.business_id = Number(business_id);

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.KPI.findAndCountAll({
            where,
            include: [{ model: db.Domain, as: 'business', attributes: ['id', 'name'], required: false }],
            limit: lim,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.updateKPI = async (req, res, next) => {
    try {
        const kpi = await db.KPI.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!kpi) return next(new AppError('NOT_FOUND', 'KPI not found', 404));
        await kpi.update(req.body);
        await _createAuditLog(req, 'UPDATE_KPI', 'kpi', String(kpi.id));
        return sendSuccess(req, res, kpi);
    } catch (err) { return next(err); }
};

exports.createKPI = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const kpi = await db.KPI.create({ ...req.body, org_id: orgId });
        await _createAuditLog(req, 'CREATE_KPI', 'kpi', String(kpi.id));
        return sendSuccess(req, res, kpi, 201);
    } catch (err) { return next(err); }
};
