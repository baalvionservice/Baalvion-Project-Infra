'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op, fn, col, literal } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

exports.listDomains = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit, search, status } = req.query;
        const where = { org_id: orgId };
        if (search) where.name = { [Op.iLike]: `%${search}%` };
        if (status) where.status = status;

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.Domain.findAndCountAll({ where, limit: lim, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.createDomain = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { name, type, description, country, country_code, currency, status } = req.body;
        if (!name) return next(new AppError('VALIDATION_ERROR', 'name is required', 400));
        const domain = await db.Domain.create({ name, type, description, country, country_code, currency, status, org_id: orgId });
        await _createAuditLog(req, 'CREATE_DOMAIN', 'domain', String(domain.id));
        return sendSuccess(req, res, domain, 201);
    } catch (err) { return next(err); }
};

exports.getDomain = async (req, res, next) => {
    try {
        const domain = await db.Domain.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!domain) return next(new AppError('NOT_FOUND', 'Domain not found', 404));
        return sendSuccess(req, res, domain);
    } catch (err) { return next(err); }
};

exports.updateDomain = async (req, res, next) => {
    try {
        const domain = await db.Domain.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!domain) return next(new AppError('NOT_FOUND', 'Domain not found', 404));
        await domain.update(req.body);
        await _createAuditLog(req, 'UPDATE_DOMAIN', 'domain', String(domain.id));
        return sendSuccess(req, res, domain);
    } catch (err) { return next(err); }
};

exports.deleteDomain = async (req, res, next) => {
    try {
        const domain = await db.Domain.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!domain) return next(new AppError('NOT_FOUND', 'Domain not found', 404));
        await domain.destroy();
        await _createAuditLog(req, 'DELETE_DOMAIN', 'domain', String(req.params.id));
        return sendSuccess(req, res, { message: 'Domain deleted' });
    } catch (err) { return next(err); }
};

exports.getDomainTrends = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const domains = await db.Domain.findAll({ where: { org_id: orgId }, raw: true });

        const trends = await Promise.all(domains.map(async (domain) => {
            const entries = await db.FinancialEntry.findAll({
                attributes: [
                    [fn('TO_CHAR', col('date'), 'YYYY-MM'), 'month'],
                    [fn('SUM', literal(`CASE WHEN type = 'Revenue' THEN amount ELSE 0 END`)), 'revenue'],
                    [fn('SUM', literal(`CASE WHEN type = 'Expense' THEN amount ELSE 0 END`)), 'expenses'],
                ],
                where: { org_id: orgId, domain_id: domain.id },
                group: [literal(`TO_CHAR(date, 'YYYY-MM')`)],
                order: [[literal(`TO_CHAR(date, 'YYYY-MM')`), 'ASC']],
                raw: true,
            });
            return { domain_id: domain.id, domain_name: domain.name, monthly: entries };
        }));

        return sendSuccess(req, res, { trends });
    } catch (err) { return next(err); }
};

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
