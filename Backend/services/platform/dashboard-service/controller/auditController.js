'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

exports.listAuditLogs = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit, action, severity, user_id, date_from, date_to } = req.query;
        const where = { org_id: orgId };
        if (action) where.action = { [Op.iLike]: `%${action}%` };
        if (severity) where.severity = severity;
        if (user_id) where.user_id = Number(user_id);
        if (date_from || date_to) {
            where.created_at = {};
            if (date_from) where.created_at[Op.gte] = new Date(date_from);
            if (date_to) where.created_at[Op.lte] = new Date(date_to);
        }

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.AuditLog.findAndCountAll({
            where,
            limit: lim,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.createAuditLog = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { action, entity_type, entity_id, user_name, role, resource, ip_address, location, status, severity, details } = req.body;
        if (!action) return next(new AppError('VALIDATION_ERROR', 'action is required', 400));
        const log = await db.AuditLog.create({
            org_id: orgId,
            action,
            entity_type,
            entity_id,
            user_id: req.user.id,
            user_name: user_name || null,
            role: role || req.user.role,
            resource,
            ip_address: ip_address || req.ip,
            location,
            status: status || 'Success',
            severity: severity || 'Info',
            details,
        });
        return sendSuccess(req, res, log, 201);
    } catch (err) { return next(err); }
};
