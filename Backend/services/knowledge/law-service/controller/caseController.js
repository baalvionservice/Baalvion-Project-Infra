'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { ensureClient } = require('../utils/provision');

const listCases = async (req, res, next) => {
    try {
        const { page = 1, status, priority, category } = req.query;
        // Cap pagination limit to prevent large data dumps.
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (category) where.category = { [Op.iLike]: `%${category}%` };

        if (!req.user.isAdmin) {
            const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
            const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
            const conditions = [];
            if (client) conditions.push({ client_id: client.id });
            if (lawyer) conditions.push({ lawyer_id: lawyer.id });
            if (conditions.length === 0) return sendPaginated(req, res, { items: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } });
            if (conditions.length === 1) Object.assign(where, conditions[0]);
            else where[Op.or] = conditions;
        }

        const offset = (Number(page) - 1) * limit;
        const { count, rows } = await db.Case.findAndCountAll({
            where,
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email'], required: false },
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit, totalPages: Math.ceil(count / limit) },
        });
    } catch (err) { return next(err); }
};

const getCase = async (req, res, next) => {
    try {
        const legalCase = await db.Case.findByPk(req.params.id, {
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email', 'user_id'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email', 'specializations', 'user_id'], required: false },
            ],
        });
        if (!legalCase) return next(new AppError('NOT_FOUND', 'Case not found', 404));
        // IDOR: non-admin callers may only view cases they own as client or lawyer.
        if (!req.user.isAdmin) {
            const uid = String(req.user.id);
            const isOwner =
                (legalCase.client && String(legalCase.client.user_id) === uid) ||
                (legalCase.lawyer && String(legalCase.lawyer.user_id) === uid);
            if (!isOwner) return next(new AppError('FORBIDDEN', 'Not authorised to view this case', 403));
        }
        return sendSuccess(req, res, legalCase);
    } catch (err) { return next(err); }
};

const createCase = async (req, res, next) => {
    try {
        const client = await ensureClient(req);
        if (!client) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
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
        const legalCase = await db.Case.findByPk(req.params.id, {
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'user_id'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'user_id'], required: false },
            ],
        });
        if (!legalCase) return next(new AppError('NOT_FOUND', 'Case not found', 404));
        // IDOR: non-admin callers may only update cases they own as client or lawyer.
        if (!req.user.isAdmin) {
            const uid = String(req.user.id);
            const isOwner =
                (legalCase.client && String(legalCase.client.user_id) === uid) ||
                (legalCase.lawyer && String(legalCase.lawyer.user_id) === uid);
            if (!isOwner) return next(new AppError('FORBIDDEN', 'Not authorised to update this case', 403));
        }
        // Mass-assignment guard: only allow safe client-editable fields.
        const { title, description, category, priority, notes } = req.body;
        const patch = {};
        if (title      !== undefined) patch.title       = title;
        if (description !== undefined) patch.description = description;
        if (category   !== undefined) patch.category    = category;
        if (priority   !== undefined) patch.priority    = priority;
        if (notes      !== undefined) patch.notes       = notes;
        await legalCase.update(patch);
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
        const legalCase = await db.Case.findByPk(req.params.id, {
            include: [{ model: db.Client, as: 'client', attributes: ['id', 'user_id'] }],
        });
        if (!legalCase) return next(new AppError('NOT_FOUND', 'Case not found', 404));
        // IDOR: only the owning client (or an admin) may assign/re-assign a lawyer.
        if (!req.user.isAdmin) {
            const uid = String(req.user.id);
            const isOwningClient = legalCase.client && String(legalCase.client.user_id) === uid;
            if (!isOwningClient) return next(new AppError('FORBIDDEN', 'Only the case owner may assign a lawyer', 403));
        }
        const lawyer = await db.Lawyer.findOne({ where: { id: lawyer_id, status: 'active' } });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found or not active', 404));
        await legalCase.update({ lawyer_id: lawyer.id, status: 'in_progress' });
        return sendSuccess(req, res, legalCase);
    } catch (err) { return next(err); }
};

module.exports = { listCases, getCase, createCase, updateCase, updateCaseStatus, assignLawyer };
