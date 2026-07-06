'use strict';
/**
 * Fraud Detection — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 11). Admin/reviewer-only: fraud alerts are never
 * self-service — an org cannot see or dismiss its own fraud signals.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, actorOf } = require('../service/verification/access');
const fraudSvc = require('../service/verification/fraud');
const { FraudSignal } = db;

const listSignals = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
        const { status, severity, signal_type, org_id, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        if (severity) where.severity = severity;
        if (signal_type) where.signal_type = signal_type;
        if (org_id) where.org_id = Number(org_id);
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await FraudSignal.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

async function setStatus(req, res, next, status) {
    if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
    const record = await FraudSignal.findByPk(req.params.id);
    if (!record) return next(new AppError('NOT_FOUND', 'Fraud signal not found', 404));
    await record.update({ status, reviewed_by: actorOf(req), reviewed_at: new Date() });
    await recordAudit({
        actorId: actorOf(req), action: `fraud_signal.${status}`, resourceType: 'fraud_signal',
        resourceId: record.id, tenantId: record.tenant_id, metadata: { signalType: record.signal_type },
    });
    return sendSuccess(req, res, record);
}
const confirmSignal = (req, res, next) => setStatus(req, res, next, 'confirmed').catch(next);
const dismissSignal = (req, res, next) => setStatus(req, res, next, 'dismissed').catch(next);

const scanUser = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
        const { user_id } = req.body || {};
        if (!user_id) return next(new AppError('VALIDATION_ERROR', '`user_id` is required', 422));
        const user = await db.User.findByPk(user_id);
        if (!user) return next(new AppError('NOT_FOUND', 'User not found', 404));
        const flagged = await fraudSvc.checkExcessiveFailedLogins(user);
        await recordAudit({
            actorId: actorOf(req), action: 'fraud_signal.scan_user', resourceType: 'user',
            resourceId: user.id, tenantId: user.tenant_id, metadata: { flagged },
        });
        return sendSuccess(req, res, { user_id: user.id, flagged });
    } catch (err) {
        return next(err);
    }
};

module.exports = { listSignals, confirmSignal, dismissSignal, scanUser };
