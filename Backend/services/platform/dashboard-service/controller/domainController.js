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
        const { name, type, description, country, country_code, currency, status } = req.body;
        await domain.update({ name, type, description, country, country_code, currency, status });
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

// ISO-3166 alpha-2 country code → flag emoji (regional indicator symbols).
function _flag(cc) {
    if (!cc || cc.length !== 2) return '🏳️';
    return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}
const _monthLabel = (ym) => {
    const [y, m] = String(ym).split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'short' });
};

// Business analytics derived from real data (domains + kpis + financial entries):
// { ranking, comparison:{revenueLast3Months,growthRates,profitMargins}, deepDive:{[id]:{...}} }
exports.getBusinessAnalytics = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const [domains, kpis] = await Promise.all([
            db.Domain.findAll({ where: { org_id: orgId }, raw: true }),
            db.KPI.findAll({ where: { org_id: orgId }, raw: true }),
        ]);
        const kpiByBiz = Object.fromEntries(kpis.map((k) => [String(k.business_id), k]));

        // Per-domain monthly revenue/expenses.
        const perBiz = await Promise.all(domains.map(async (d) => {
            const monthly = (await db.FinancialEntry.findAll({
                attributes: [
                    [fn('TO_CHAR', col('date'), 'YYYY-MM'), 'month'],
                    [fn('SUM', literal(`CASE WHEN type = 'Revenue' THEN amount ELSE 0 END`)), 'revenue'],
                    [fn('SUM', literal(`CASE WHEN type = 'Expense' THEN amount ELSE 0 END`)), 'expenses'],
                ],
                where: { org_id: orgId, domain_id: d.id },
                group: [literal(`TO_CHAR(date, 'YYYY-MM')`)],
                order: [[literal(`TO_CHAR(date, 'YYYY-MM')`), 'ASC']],
                raw: true,
            })).map((e) => ({ month: e.month, revenue: Number(e.revenue), expenses: Number(e.expenses) }));

            const k = kpiByBiz[String(d.id)] || {};
            const revenue = Number(k.revenue_actual) || (monthly.length ? monthly[monthly.length - 1].revenue : 0);
            const profit = Math.round((Number(k.profit_margin) || 0) * 1000) / 10; // 0.41 -> 41.0 (%)
            let growth;
            if (monthly.length >= 2) {
                const prev = monthly[monthly.length - 2].revenue;
                const last = monthly[monthly.length - 1].revenue;
                growth = prev ? Math.round(((last - prev) / prev) * 1000) / 10 : 0;
            } else {
                growth = Math.round(Number(k.customers_change) || 0);
            }
            const nps = Number(k.nps) || 0;
            const score = Math.max(0, Math.min(100, Math.round(0.4 * profit + 0.3 * Math.min(Math.max(growth, 0), 50) * 2 + 0.3 * nps)));
            const trend = k.profit_trend === 'up' ? 'up' : k.profit_trend === 'down' ? 'down' : 'flat';
            return { id: d.id, name: d.name, country: d.country, country_code: d.country_code, revenue, profit, growth, score, nps, trend, monthly };
        }));

        const ranking = [...perBiz].sort((a, b) => b.score - a.score).map((b, i) => ({
            rank: i + 1, businessId: String(b.id), businessName: b.name,
            country: b.country, flag: _flag(b.country_code),
            revenue: b.revenue, growth: b.growth, profit: b.profit, score: b.score, trend: b.trend,
        }));

        const allMonths = [...new Set(perBiz.flatMap((b) => b.monthly.map((m) => m.month)))].sort();
        const last3 = allMonths.slice(-3);
        const revenueLast3Months = last3.map((ym) => {
            const row = { month: _monthLabel(ym) };
            for (const b of perBiz) {
                const m = b.monthly.find((x) => x.month === ym);
                row[b.name] = m ? Math.round((m.revenue / 1e6) * 10) / 10 : 0; // millions
            }
            return row;
        });
        const growthRates = perBiz.map((b) => ({ name: b.name, growth: b.growth }));
        const profitMargins = perBiz.map((b) => ({ name: b.name, margin: b.profit }));

        const deepDive = {};
        for (const b of perBiz) {
            const revenueTrend = b.monthly.map((m) => ({ month: _monthLabel(m.month), revenue: Math.round((m.revenue / 1e6) * 10) / 10 }));
            const [expRows, revRows] = await Promise.all([
                db.FinancialEntry.findAll({ attributes: ['category', [fn('SUM', col('amount')), 'total']], where: { org_id: orgId, domain_id: b.id, type: 'Expense' }, group: ['category'], raw: true }),
                db.FinancialEntry.findAll({ attributes: ['category', [fn('SUM', col('amount')), 'total']], where: { org_id: orgId, domain_id: b.id, type: 'Revenue' }, group: ['category'], raw: true }),
            ]);
            const expTotal = expRows.reduce((s, r) => s + Number(r.total), 0) || 1;
            const expenseBreakdown = expRows.map((r) => ({ name: r.category || 'Other', value: Math.round((Number(r.total) / expTotal) * 100) }));
            const revTotal = revRows.reduce((s, r) => s + Number(r.total), 0) || 1;
            const revenueSources = revRows.map((r) => ({ source: r.category || 'General', revenue: Number(r.total), percentage: Math.round((Number(r.total) / revTotal) * 100) }));
            const monthlyMetrics = b.monthly.map((m, i) => {
                const prev = i > 0 ? b.monthly[i - 1].revenue : m.revenue;
                const g = prev ? Math.round(((m.revenue - prev) / prev) * 1000) / 10 : 0;
                const prof = m.revenue - m.expenses;
                return { month: _monthLabel(m.month), revenue: `$${(m.revenue / 1e6).toFixed(2)}M`, profit: `$${(prof / 1e6).toFixed(2)}M`, growth: `${g >= 0 ? '+' : ''}${g}%` };
            });
            deepDive[String(b.id)] = { revenueTrend, expenseBreakdown, revenueSources, monthlyMetrics };
        }

        return sendSuccess(req, res, { ranking, comparison: { revenueLast3Months, growthRates, profitMargins }, deepDive });
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
