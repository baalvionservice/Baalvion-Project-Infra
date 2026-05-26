'use strict';
const crypto = require('crypto');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

function hashPin(pin) {
    return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

exports.portalAuth = async (req, res, next) => {
    try {
        const { token, pin } = req.body;
        if (!token || !pin) return next(new AppError('VALIDATION_ERROR', 'token and pin are required', 400));

        const portalAccess = await db.PortalAccess.findOne({
            where: { token, is_active: true },
            include: [{ model: db.Shareholder, as: 'shareholder', required: true }],
        });

        if (!portalAccess) return next(new AppError('UNAUTHORIZED', 'Invalid token', 401));

        const pinHash = hashPin(pin);
        if (pinHash !== portalAccess.pin_hash) {
            return next(new AppError('UNAUTHORIZED', 'Invalid PIN', 401));
        }

        // Update last accessed
        await portalAccess.update({ last_accessed_at: new Date() });

        // Get distributions for this shareholder
        const distributions = await db.DistributionHistory.findAll({
            where: { org_id: portalAccess.org_id },
            order: [['date', 'DESC']],
            limit: 12,
            raw: true,
        });

        const myDistributions = distributions.map((d) => {
            const payout = (d.payouts || []).find((p) => p.shareholder_id === portalAccess.shareholder.id);
            return payout ? { date: d.date, total_profit: d.total_profit, payout_amount: payout.amount } : null;
        }).filter(Boolean);

        return sendSuccess(req, res, {
            shareholder: {
                id: portalAccess.shareholder.id,
                name: portalAccess.shareholder.name,
                role: portalAccess.shareholder.role,
                equity_percentage: portalAccess.shareholder.equity_percentage,
            },
            distributions: myDistributions,
            last_accessed_at: portalAccess.last_accessed_at,
        });
    } catch (err) { return next(err); }
};

exports.createPortalAccess = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { shareholder_id, token, pin } = req.body;
        if (!shareholder_id || !token || !pin) {
            return next(new AppError('VALIDATION_ERROR', 'shareholder_id, token, and pin are required', 400));
        }
        const shareholder = await db.Shareholder.findOne({ where: { id: shareholder_id, org_id: orgId } });
        if (!shareholder) return next(new AppError('NOT_FOUND', 'Shareholder not found', 404));

        const pin_hash = hashPin(pin);
        const access = await db.PortalAccess.create({ org_id: orgId, shareholder_id, token, pin_hash });
        return sendSuccess(req, res, { id: access.id, shareholder_id, token, is_active: access.is_active }, 201);
    } catch (err) { return next(err); }
};
