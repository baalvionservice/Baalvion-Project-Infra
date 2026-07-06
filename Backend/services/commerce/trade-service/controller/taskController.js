'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function callerUserId(req) {
    return (req.auth && req.auth.userId) || null;
}

// Tasks are private per-org data (not marketplace-visible like RFQ/Listing), so
// every route requires auth and ownership is enforced on every fetch, not just writes.
async function fetchTaskOwned(id, req, next) {
    const task = await db.Task.findByPk(id);
    if (!task) { next(new AppError('NOT_FOUND', 'Task not found', 404)); return null; }
    if (isAdmin(req)) return task;
    const tenantId = callerTenantId(req);
    if (tenantId && task.tenant_id && task.tenant_id !== tenantId) {
        next(new AppError('FORBIDDEN', 'You do not have permission to access this task', 403)); return null;
    }
    return task;
}

const listTasks = async (req, res, next) => {
    try {
        const {
            status, priority, assigned_to_user_id, related_entity_type, related_entity_id,
            due_before, due_after, search, page = 1, limit = 20,
        } = req.query;
        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assigned_to_user_id) where.assigned_to_user_id = assigned_to_user_id;
        if (related_entity_type) where.related_entity_type = related_entity_type;
        if (related_entity_id) where.related_entity_id = related_entity_id;
        if (search) where.title = { [Op.iLike]: `%${search}%` };
        if (due_before || due_after) {
            where.due_date = {};
            if (due_before) where.due_date[Op.lte] = new Date(due_before);
            if (due_after) where.due_date[Op.gte] = new Date(due_after);
        }
        // Defense in depth: scope explicitly from the verified caller identity, on top of
        // the tenant hook + RLS (matches the convention in orderController.listOrders).
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Task.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

const getTask = async (req, res, next) => {
    try {
        const task = await fetchTaskOwned(req.params.id, req, next);
        if (!task) return undefined;
        return sendSuccess(req, res, task);
    } catch (err) {
        return next(err);
    }
};

const createTask = async (req, res, next) => {
    try {
        // Stamp tenant_id/created_by from server context; never accept from client.
        const { tenant_id: _ignored, created_by_user_id: _ignoredCreator, ...body } = req.body || {};
        const tenantId = callerTenantId(req);
        const task = await db.Task.create({
            ...body,
            ...(tenantId ? { tenant_id: tenantId } : {}),
            created_by_user_id: callerUserId(req),
        });
        if (task.assigned_to_user_id) {
            await db.Notification.create({
                tenant_id: task.tenant_id,
                recipient_org_id: task.assigned_to_org_id || tenantId,
                type: 'task_assigned',
                title: 'New task assigned',
                message: task.title,
                entity_type: 'task',
                entity_id: task.id,
            });
        }
        return sendSuccess(req, res, task, 201);
    } catch (err) {
        return next(err);
    }
};

const updateTask = async (req, res, next) => {
    try {
        const task = await fetchTaskOwned(req.params.id, req, next);
        if (!task) return undefined;
        const { tenant_id: _ignored, created_by_user_id: _ignoredCreator, ...updates } = req.body || {};
        await task.update(updates);
        return sendSuccess(req, res, task);
    } catch (err) {
        return next(err);
    }
};

const completeTask = async (req, res, next) => {
    try {
        const task = await fetchTaskOwned(req.params.id, req, next);
        if (!task) return undefined;
        await task.update({ status: 'completed', completed_at: new Date() });
        return sendSuccess(req, res, task);
    } catch (err) {
        return next(err);
    }
};

const deleteTask = async (req, res, next) => {
    try {
        const task = await fetchTaskOwned(req.params.id, req, next);
        if (!task) return undefined;
        await task.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) {
        return next(err);
    }
};

module.exports = { listTasks, getTask, createTask, updateTask, completeTask, deleteTask };
