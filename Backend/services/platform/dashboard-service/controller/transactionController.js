'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op, fn, col, literal } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

exports.listTransactions = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit, business_id, gateway, status, date_from, date_to } = req.query;
        const where = { org_id: orgId };
        if (business_id) where.business_id = Number(business_id);
        if (gateway) where.gateway = gateway;
        if (status) where.status = status;
        if (date_from || date_to) {
            where.created_at = {};
            if (date_from) where.created_at[Op.gte] = new Date(date_from);
            if (date_to) where.created_at[Op.lte] = new Date(date_to);
        }

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.Transaction.findAndCountAll({
            where,
            include: [{ model: db.Domain, as: 'business', attributes: ['id', 'name'], required: false }],
            limit: lim,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.getCompanySummary = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;

        const revenueResult = await db.FinancialEntry.findOne({
            attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
            where: { org_id: orgId, type: 'Revenue' },
            raw: true,
        });
        const expenseResult = await db.FinancialEntry.findOne({
            attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
            where: { org_id: orgId, type: 'Expense' },
            raw: true,
        });

        const total_revenue = parseFloat(revenueResult.total) || 0;
        const total_expenses = parseFloat(expenseResult.total) || 0;
        const total_profit = total_revenue - total_expenses;
        const profit_margin_percentage = total_revenue > 0
            ? parseFloat(((total_profit / total_revenue) * 100).toFixed(2))
            : 0;

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
            profit: (parseFloat(m.revenue) || 0) - (parseFloat(m.expenses) || 0),
        }));

        return sendSuccess(req, res, {
            total_revenue,
            total_expenses,
            total_profit,
            profit_margin_percentage,
            trend,
        });
    } catch (err) { return next(err); }
};
