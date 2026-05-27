'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listCases = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, priority, category } = req.query;
        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (category) where.category = { [Op.iLike]: `%${category}%` };

        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r))) {
            const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
            const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
            const conditions = [];
            if (client) conditions.push({ client_id: client.id });
            if (lawyer) conditions.push({ lawyer_id: lawyer.id });
            if (conditions.length === 0) return sendPaginated(req, res, { items: [], pagination: { total: 0, page: 1, limit: Number(limit), totalPages: 0 } });
            if (conditions.length === 1) Object.assign(where, conditions[0]);
            else where[Op.or] = conditions;
        }

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Case.findAndCountAll({
            where,
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email'], required: false },
            ],
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

const getCase = async (req, res, next) => {
    try {
        const legalCase = await db.Case.findByPk(req.params.id, {
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email', 'specializations'], required: false },
            ],
        });
        if (!legalCase) return next(new AppError('NOT_FOUND', 'Case not found', 404));
        return sendSuccess(req, res, legalCase);
    } catch (err) { return next(err); }
};

const createCase = async (req, res, next) => {
    try {
        const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
        if (!client) return next(new AppError('NOT_FOUND', 'Client profile not found', 404));
        const { title, description, category, priority } = req.body;
        const legalCase = await db.Case.create({
            client_id: client.id,
            lawyer_id: null,
            title,
            description,
            category,
            priority: priority || 'medium',
            status: 'open',
        });
        return sendSuccess(req, res, legalCase, 201);
    } catch (err) { return next(err); }
};

const updateCase = async (req, res, next) => {
    try {
        const legalCase = await db.Case.findByPk(req.params.id);
        if (!legalCase) return next(new AppError('NOT_FOUND', 'Case not found', 404));
        delete req.body.client_id;
        await legalCase.update(req.body);
        return sendSuccess(req, res, legalCase);
    } catch (err) { return next(err); }
};

const updateCaseStatus = async (req, res, next) => {
    try {
        const { status, outcome } = req.body;
        const allowed = ['open', 'in_progress', 'closed', 'archived'];
        if (!allowed.includes(status)) return next(new AppError('BAD_REQUEST', 'Invalid status', 400));
        const legalCase = await db.Case.findByPk(req.params.id);
        if (!legalCase) return next(new AppError('NOT_FOUND', 'Case not found', 404));
        const updates = { status };
        if (outcome) updates.outcome = outcome;
        if (status === 'closed') updates.closed_at = new Date();
        await legalCase.update(updates);
        return sendSuccess(req, res, legalCase);
    } catch (err) { return next(err); }
};

const assignLawyer = async (req, res, next) => {
    try {
        const { lawyer_id } = req.body;
        const legalCase = await db.Case.findByPk(req.params.id);
        if (!legalCase) return next(new AppError('NOT_FOUND', 'Case not found', 404));
        const lawyer = await db.Lawyer.findOne({ where: { id: lawyer_id, status: 'active' } });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found or not active', 404));
        await legalCase.update({ lawyer_id: lawyer.id, status: 'in_progress' });
        return sendSuccess(req, res, legalCase);
    } catch (err) { return next(err); }
};

module.exports = { listCases, getCase, createCase, updateCase, updateCaseStatus, assignLawyer };
