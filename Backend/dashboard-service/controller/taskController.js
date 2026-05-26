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

exports.listTasks = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit, assignee_id, status, business_id, priority } = req.query;
        const where = { org_id: orgId };
        if (assignee_id) where.assignee_id = Number(assignee_id);
        if (status) where.status = status;
        if (business_id) where.business_id = Number(business_id);
        if (priority) where.priority = priority;

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.Task.findAndCountAll({
            where,
            include: [
                { model: db.Employee, as: 'assignee', attributes: ['id', 'name', 'role'], required: false },
                { model: db.Domain, as: 'business', attributes: ['id', 'name'], required: false },
            ],
            limit: lim,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.createTask = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { title, description, status, assignee_id, business_id, priority, due_date } = req.body;
        if (!title) return next(new AppError('VALIDATION_ERROR', 'title is required', 400));
        const task = await db.Task.create({ title, description, status, assignee_id, business_id, priority, due_date, org_id: orgId });
        await _createAuditLog(req, 'CREATE_TASK', 'task', String(task.id));
        return sendSuccess(req, res, task, 201);
    } catch (err) { return next(err); }
};

exports.updateTask = async (req, res, next) => {
    try {
        const task = await db.Task.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!task) return next(new AppError('NOT_FOUND', 'Task not found', 404));
        await task.update(req.body);
        await _createAuditLog(req, 'UPDATE_TASK', 'task', String(task.id));
        return sendSuccess(req, res, task);
    } catch (err) { return next(err); }
};

exports.addComment = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { id } = req.params;
        const { author_id, text } = req.body;
        if (!text) return next(new AppError('VALIDATION_ERROR', 'text is required', 400));

        const task = await db.Task.findOne({ where: { id, org_id: orgId } });
        if (!task) return next(new AppError('NOT_FOUND', 'Task not found', 404));

        const comment = await db.TaskComment.create({ task_id: task.id, author_id, text });
        await _createAuditLog(req, 'ADD_TASK_COMMENT', 'task_comment', String(comment.id));
        return sendSuccess(req, res, comment, 201);
    } catch (err) { return next(err); }
};

exports.getTask = async (req, res, next) => {
    try {
        const task = await db.Task.findOne({
            where: { id: req.params.id, org_id: req.user.orgId },
            include: [
                { model: db.Employee, as: 'assignee', attributes: ['id', 'name'], required: false },
                { model: db.Domain, as: 'business', attributes: ['id', 'name'], required: false },
                {
                    model: db.TaskComment, as: 'comments', required: false,
                    include: [{ model: db.Employee, as: 'author', attributes: ['id', 'name'], required: false }],
                },
            ],
        });
        if (!task) return next(new AppError('NOT_FOUND', 'Task not found', 404));
        return sendSuccess(req, res, task);
    } catch (err) { return next(err); }
};
