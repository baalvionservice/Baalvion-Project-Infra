'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

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

exports.getUserPermissions = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { user_id } = req.params;
        const permissions = await db.Permission.findAll({ where: { org_id: orgId, user_id: Number(user_id) } });
        return sendSuccess(req, res, { user_id: Number(user_id), permissions });
    } catch (err) { return next(err); }
};

exports.assignPermission = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { user_id, module, access } = req.body;
        if (!user_id || !module || !access) {
            return next(new AppError('VALIDATION_ERROR', 'user_id, module, and access are required', 400));
        }
        if (!['read', 'write', 'admin'].includes(access)) {
            return next(new AppError('VALIDATION_ERROR', 'access must be read, write, or admin', 400));
        }

        const [permission, created] = await db.Permission.findOrCreate({
            where: { org_id: orgId, user_id: Number(user_id), module },
            defaults: { org_id: orgId, user_id: Number(user_id), module, access },
        });

        if (!created) {
            await permission.update({ access });
        }

        await _createAuditLog(req, 'ASSIGN_PERMISSION', 'permission', String(permission.id));
        return sendSuccess(req, res, permission, created ? 201 : 200);
    } catch (err) { return next(err); }
};

exports.getPermissionMatrix = async (req, res, next) => {
    try {
        const matrix = {
            admin: [
                { module: 'finance', actions: ['read', 'write', 'delete'] },
                { module: 'employees', actions: ['read', 'write', 'delete'] },
                { module: 'domains', actions: ['read', 'write', 'delete'] },
                { module: 'shareholders', actions: ['read', 'write', 'delete'] },
                { module: 'compliance', actions: ['read', 'write', 'delete'] },
                { module: 'audit', actions: ['read', 'write'] },
                { module: 'reports', actions: ['read', 'write', 'delete'] },
                { module: 'tasks', actions: ['read', 'write', 'delete'] },
                { module: 'kpis', actions: ['read', 'write'] },
                { module: 'operations', actions: ['read', 'write', 'delete'] },
            ],
            manager: [
                { module: 'finance', actions: ['read', 'write'] },
                { module: 'employees', actions: ['read', 'write'] },
                { module: 'domains', actions: ['read', 'write'] },
                { module: 'shareholders', actions: ['read'] },
                { module: 'compliance', actions: ['read', 'write'] },
                { module: 'audit', actions: ['read'] },
                { module: 'reports', actions: ['read', 'write'] },
                { module: 'tasks', actions: ['read', 'write'] },
                { module: 'kpis', actions: ['read', 'write'] },
                { module: 'operations', actions: ['read', 'write'] },
            ],
            viewer: [
                { module: 'finance', actions: ['read'] },
                { module: 'employees', actions: ['read'] },
                { module: 'domains', actions: ['read'] },
                { module: 'shareholders', actions: ['read'] },
                { module: 'compliance', actions: ['read'] },
                { module: 'audit', actions: ['read'] },
                { module: 'reports', actions: ['read'] },
                { module: 'tasks', actions: ['read'] },
                { module: 'kpis', actions: ['read'] },
                { module: 'operations', actions: ['read'] },
            ],
        };
        return sendSuccess(req, res, matrix);
    } catch (err) { return next(err); }
};
