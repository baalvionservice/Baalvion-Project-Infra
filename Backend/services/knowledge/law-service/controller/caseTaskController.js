'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { loadOwnedCase } = require('../utils/caseAccess');

const listTasks = async (req, res, next) => {
    try {
        const { error } = await loadOwnedCase(req);
        if (error) return next(error);
        const tasks = await db.CaseTask.findAll({
            where: { case_id: req.params.id },
            order: [['created_at', 'ASC']],
        });
        return sendSuccess(req, res, tasks);
    } catch (err) { return next(err); }
};

const createTask = async (req, res, next) => {
    try {
        const { error, legalCase } = await loadOwnedCase(req);
        if (error) return next(error);
        const { title } = req.body || {};
        if (!title || !String(title).trim()) return next(new AppError('VALIDATION_ERROR', 'title is required', 422));
        const task = await db.CaseTask.create({
            case_id: legalCase.id,
            title: String(title).trim(),
            status: 'pending',
        });
        return sendSuccess(req, res, task, 201);
    } catch (err) { return next(err); }
};

const updateTaskStatus = async (req, res, next) => {
    try {
        const { error } = await loadOwnedCase(req);
        if (error) return next(error);
        const { status } = req.body || {};
        if (!['pending', 'completed'].includes(status)) {
            return next(new AppError('VALIDATION_ERROR', 'status must be pending or completed', 422));
        }
        const task = await db.CaseTask.findOne({ where: { id: req.params.taskId, case_id: req.params.id } });
        if (!task) return next(new AppError('NOT_FOUND', 'Task not found', 404));
        await task.update({ status });
        return sendSuccess(req, res, task);
    } catch (err) { return next(err); }
};

module.exports = { listTasks, createTask, updateTaskStatus };
