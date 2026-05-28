'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { Op, fn, col, literal } = require('sequelize');

exports.getDashboardTotal = async (req, res, next) => {
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

        return sendSuccess(req, res, {
            total_revenue,
            total_expenses,
            total_profit,
            profit_margin_percentage,
        });
    } catch (err) { return next(err); }
};

exports.getDashboardDomains = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const domains = await db.Domain.findAll({ where: { org_id: orgId }, raw: true });

        const results = await Promise.all(domains.map(async (domain) => {
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
            return {
                id: domain.id,
                name: domain.name,
                revenue,
                expenses,
                profit: revenue - expenses,
            };
        }));

        return sendSuccess(req, res, { domains: results });
    } catch (err) { return next(err); }
};

exports.getShareholderDashboard = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { id } = req.params;

        const shareholder = await db.Shareholder.findOne({ where: { id, org_id: orgId } });
        if (!shareholder) return next(new AppError('NOT_FOUND', 'Shareholder not found', 404));

        const distributions = await db.DistributionHistory.findAll({
            where: { org_id: orgId },
            order: [['date', 'DESC']],
            raw: true,
        });

        const myDistributions = distributions.map((d) => {
            const payout = (d.payouts || []).find((p) => p.shareholder_id === shareholder.id);
            return payout
                ? { date: d.date, total_profit: d.total_profit, payout_amount: payout.amount }
                : null;
        }).filter(Boolean);

        return sendSuccess(req, res, {
            shareholder: {
                id: shareholder.id,
                name: shareholder.name,
                role: shareholder.role,
                equity_percentage: shareholder.equity_percentage,
            },
            distributions: myDistributions,
        });
    } catch (err) { return next(err); }
};
