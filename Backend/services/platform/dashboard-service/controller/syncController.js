'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { computeSync } = require('../service/syncMetrics');

async function _audit(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId, action, entity_type, entity_id,
            user_id: req.user.id, role: req.user.role, resource: req.originalUrl,
            ip_address: req.ip, status: 'Success', severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

exports.get = async (req, res, next) => {
    try {
        const payload = await computeSync(db, req.user.orgId);
        return sendSuccess(req, res, payload);
    } catch (err) { return next(err); }
};

exports.resolveConflict = async (req, res, next) => {
    try {
        const row = await db.SyncConflict.findOne({ where: { conflict_key: req.params.conflictKey, org_id: req.user.orgId } });
        if (!row) return next(new AppError('NOT_FOUND', 'Conflict not found', 404));
        const { action } = req.body;
        if (!action) return next(new AppError('VALIDATION_ERROR', 'action is required', 400));
        await row.update({
            resolved: true,
            resolved_by: req.user.name || req.user.email || String(req.user.id),
            resolved_at: new Date(),
            action,
        });
        await _audit(req, 'RESOLVE_SYNC_CONFLICT', 'sync_conflict', row.conflict_key);
        return sendSuccess(req, res, { conflictKey: row.conflict_key, resolved: true, action });
    } catch (err) { return next(err); }
};
