'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op, fn, col, literal } = require('sequelize');

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

exports.listFinancials = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit, domain_id, type, date_from, date_to } = req.query;
        const where = { org_id: orgId };
        if (domain_id) where.domain_id = Number(domain_id);
        if (type) where.type = type;
        if (date_from || date_to) {
            where.date = {};
            if (date_from) where.date[Op.gte] = date_from;
            if (date_to) where.date[Op.lte] = date_to;
        }
        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.FinancialEntry.findAndCountAll({
            where,
            include: [{ model: db.Domain, as: 'domain', attributes: ['id', 'name'], required: false }],
            limit: lim,
            offset,
            order: [['date', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.createFinancial = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { domain_id, type, amount, date, description, category } = req.body;
        if (!type || !amount || !date) return next(new AppError('VALIDATION_ERROR', 'type, amount, and date are required', 400));
        if (!['Revenue', 'Expense'].includes(type)) return next(new AppError('VALIDATION_ERROR', 'type must be Revenue or Expense', 400));
        const entry = await db.FinancialEntry.create({ domain_id, type, amount, date, description, category, org_id: orgId });
        await _createAuditLog(req, 'CREATE_FINANCIAL_ENTRY', 'financial_entry', String(entry.id));
        return sendSuccess(req, res, entry, 201);
    } catch (err) { return next(err); }
};

exports.getFinancial = async (req, res, next) => {
    try {
        const entry = await db.FinancialEntry.findOne({
            where: { id: req.params.id, org_id: req.user.orgId },
            include: [{ model: db.Domain, as: 'domain', attributes: ['id', 'name'], required: false }],
        });
        if (!entry) return next(new AppError('NOT_FOUND', 'Financial entry not found', 404));
        return sendSuccess(req, res, entry);
    } catch (err) { return next(err); }
};

exports.getFinancialsByDomain = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { domain_id } = req.params;
        const { page, limit } = req.query;
        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.FinancialEntry.findAndCountAll({
            where: { org_id: orgId, domain_id: Number(domain_id) },
            limit: lim,
            offset,
            order: [['date', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.calculateProfit = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const domains = await db.Domain.findAll({ where: { org_id: orgId }, raw: true });

        let total_revenue = 0;
        let total_expenses = 0;

        const domainProfits = await Promise.all(domains.map(async (domain) => {
            const rev = await db.FinancialEntry.findOne({
                attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
                where: { org_id: orgId, domain_id: domain.id, type: 'Revenue' },
                raw: true,
            });
            const exp = await db.FinancialEntry.findOne({
                attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
                where: { org_id: orgId, domain_id: domain.id, type: 'Expense' },
                raw: true,
            });
            const revenue = parseFloat(rev.total) || 0;
            const expenses = parseFloat(exp.total) || 0;
            total_revenue += revenue;
            total_expenses += expenses;
            return { domain_id: domain.id, name: domain.name, revenue, expenses, profit: revenue - expenses };
        }));

        // Also include entries without domain
        const noDomainRev = await db.FinancialEntry.findOne({
            attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
            where: { org_id: orgId, domain_id: null, type: 'Revenue' },
            raw: true,
        });
        const noDomainExp = await db.FinancialEntry.findOne({
            attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
            where: { org_id: orgId, domain_id: null, type: 'Expense' },
            raw: true,
        });
        total_revenue += parseFloat(noDomainRev.total) || 0;
        total_expenses += parseFloat(noDomainExp.total) || 0;

        const total_profit = total_revenue - total_expenses;
        return sendSuccess(req, res, { total_revenue, total_expenses, total_profit, domains: domainProfits });
    } catch (err) { return next(err); }
};

exports.getProfitSummary = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;

        const monthly = await db.FinancialEntry.findAll({
            attributes: [
                [fn('TO_CHAR', col('date'), 'YYYY-MM'), 'month'],
                [fn('SUM', literal(`CASE WHEN type = 'Revenue' THEN amount ELSE 0 END`)), 'revenue'],
                [fn('SUM', literal(`CASE WHEN type = 'Expense' THEN amount ELSE 0 END`)), 'expenses'],
            ],
            where: { org_id: orgId },
            group: [literal(`TO_CHAR(date, 'YYYY-MM')`)],
            order: [[literal(`TO_CHAR(date, 'YYYY-MM')`), 'ASC']],
            raw: true,
        });

        const trend = monthly.map((m) => ({
            month: m.month,
            revenue: parseFloat(m.revenue) || 0,
            expenses: parseFloat(m.expenses) || 0,
            profit: (parseFloat(m.revenue) || 0) - (parseFloat(m.expenses) || 0),
        }));

        const total_revenue = trend.reduce((s, m) => s + m.revenue, 0);
        const total_expenses = trend.reduce((s, m) => s + m.expenses, 0);
        const total_profit = total_revenue - total_expenses;

        return sendSuccess(req, res, { total_revenue, total_expenses, total_profit, trend });
    } catch (err) { return next(err); }
};
