'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { loadOwnedCase } = require('../utils/caseAccess');

const listTimeLogs = async (req, res, next) => {
    try {
        const { error } = await loadOwnedCase(req);
        if (error) return next(error);
        const logs = await db.CaseTimeLog.findAll({
            where: { case_id: req.params.id },
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, logs);
    } catch (err) { return next(err); }
};

const createTimeLog = async (req, res, next) => {
    try {
        const { error, legalCase } = await loadOwnedCase(req);
        if (error) return next(error);
        const { durationMinutes, isBillable, category, description } = req.body || {};
        const minutes = Number(durationMinutes);
        if (!minutes || minutes <= 0) {
            return next(new AppError('VALIDATION_ERROR', 'durationMinutes must be a positive number', 422));
        }
        const log = await db.CaseTimeLog.create({
            case_id: legalCase.id,
            author_id: req.user.id,
            duration_minutes: Math.round(minutes),
            is_billable: isBillable !== false,
            category: category || null,
            description: description || null,
        });
        return sendSuccess(req, res, log, 201);
    } catch (err) { return next(err); }
};

module.exports = { listTimeLogs, createTimeLog };
