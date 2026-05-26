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

exports.listShareholders = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const shareholders = await db.Shareholder.findAll({ where: { org_id: orgId }, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, shareholders);
    } catch (err) { return next(err); }
};

exports.createShareholder = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { name, role, equity_percentage } = req.body;
        if (!name || !role || equity_percentage === undefined) {
            return next(new AppError('VALIDATION_ERROR', 'name, role, and equity_percentage are required', 400));
        }
        const validRoles = ['Founder', 'CEO', 'Investor', 'Co-Founder'];
        if (!validRoles.includes(role)) {
            return next(new AppError('VALIDATION_ERROR', `role must be one of: ${validRoles.join(', ')}`, 400));
        }

        // Check total equity
        const existing = await db.Shareholder.findAll({ where: { org_id: orgId }, raw: true });
        const currentTotal = existing.reduce((s, sh) => s + parseFloat(sh.equity_percentage), 0);
        if (currentTotal + parseFloat(equity_percentage) > 100) {
            return next(new AppError('VALIDATION_ERROR', `Total equity would exceed 100%. Current total: ${currentTotal.toFixed(2)}%`, 400));
        }

        const shareholder = await db.Shareholder.create({ name, role, equity_percentage, org_id: orgId });
        await _createAuditLog(req, 'CREATE_SHAREHOLDER', 'shareholder', String(shareholder.id));
        return sendSuccess(req, res, shareholder, 201);
    } catch (err) { return next(err); }
};

exports.getShareholder = async (req, res, next) => {
    try {
        const shareholder = await db.Shareholder.findOne({
            where: { id: req.params.id, org_id: req.user.orgId },
            include: [{ model: db.EquityHistory, as: 'equity_history', required: false }],
        });
        if (!shareholder) return next(new AppError('NOT_FOUND', 'Shareholder not found', 404));
        return sendSuccess(req, res, shareholder);
    } catch (err) { return next(err); }
};

exports.updateShareholder = async (req, res, next) => {
    try {
        const shareholder = await db.Shareholder.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!shareholder) return next(new AppError('NOT_FOUND', 'Shareholder not found', 404));

        const oldPct = parseFloat(shareholder.equity_percentage);
        await shareholder.update(req.body);

        if (req.body.equity_percentage !== undefined && parseFloat(req.body.equity_percentage) !== oldPct) {
            await db.EquityHistory.create({
                shareholder_id: shareholder.id,
                old_percentage: oldPct,
                new_percentage: parseFloat(req.body.equity_percentage),
                reason: req.body.reason || 'Updated',
                changed_by: req.user.id,
                org_id: req.user.orgId,
            });
        }
        await _createAuditLog(req, 'UPDATE_SHAREHOLDER', 'shareholder', String(shareholder.id));
        return sendSuccess(req, res, shareholder);
    } catch (err) { return next(err); }
};

exports.runDistribution = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { total_profit, retention_percentage, date } = req.body;
        if (total_profit === undefined || retention_percentage === undefined || !date) {
            return next(new AppError('VALIDATION_ERROR', 'total_profit, retention_percentage, and date are required', 400));
        }

        const retPct = parseFloat(retention_percentage);
        const profit = parseFloat(total_profit);
        const retained_amount = profit * (retPct / 100);
        const distributed_amount = profit - retained_amount;

        const shareholders = await db.Shareholder.findAll({ where: { org_id: orgId }, raw: true });

        const payouts = shareholders.map((sh) => ({
            shareholder_id: sh.id,
            name: sh.name,
            role: sh.role,
            equity_percentage: parseFloat(sh.equity_percentage),
            amount: parseFloat((distributed_amount * (parseFloat(sh.equity_percentage) / 100)).toFixed(2)),
        }));

        const record = await db.DistributionHistory.create({
            org_id: orgId,
            total_profit: profit,
            retention_percentage: retPct,
            retained_amount,
            distributed_amount,
            date,
            payouts,
        });

        await _createAuditLog(req, 'RUN_DISTRIBUTION', 'distribution', String(record.id));

        return sendSuccess(req, res, {
            id: record.id,
            date,
            total_profit: profit,
            retention_percentage: retPct,
            retained_amount,
            distributed_amount,
            payouts,
        }, 201);
    } catch (err) { return next(err); }
};

exports.getDistributionHistory = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit } = req.query;
        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.DistributionHistory.findAndCountAll({
            where: { org_id: orgId },
            limit: lim,
            offset,
            order: [['date', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.getShareholderPerformance = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const shareholders = await db.Shareholder.findAll({ where: { org_id: orgId }, raw: true });
        const distributions = await db.DistributionHistory.findAll({ where: { org_id: orgId }, raw: true });

        const performance = shareholders.map((sh) => {
            const totalReceived = distributions.reduce((sum, dist) => {
                const payout = (dist.payouts || []).find((p) => p.shareholder_id === sh.id);
                return sum + (payout ? parseFloat(payout.amount) : 0);
            }, 0);
            return {
                id: sh.id,
                name: sh.name,
                role: sh.role,
                equity_percentage: parseFloat(sh.equity_percentage),
                total_distributions_received: parseFloat(totalReceived.toFixed(2)),
                distribution_count: distributions.filter((d) => (d.payouts || []).some((p) => p.shareholder_id === sh.id)).length,
            };
        });

        return sendSuccess(req, res, { performance });
    } catch (err) { return next(err); }
};
