'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const buildPagination = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});

const listViewings = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};
        if ((req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r)) && req.user.orgId) {
            where.org_id = req.user.orgId;
        } else {
            where[Op.or] = [{ org_id: req.user.orgId }, { user_id: req.user.id }];
        }
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Viewing.findAndCountAll({
            where,
            include: [
                { model: db.Property, as: 'property', attributes: ['id', 'title', 'city', 'address'], required: false },
                { model: db.Agent, as: 'agent', attributes: ['id', 'name', 'email', 'phone'], required: false },
            ],
            limit,
            offset,
            order: [['scheduled_at', 'ASC']],
        });
        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (e) { return next(e); }
};

const scheduleViewing = async (req, res, next) => {
    try {
        const { property_id, agent_id, scheduled_at, duration_min, notes, user_name, user_email, user_phone } = req.body;
        if (!property_id) return next(new AppError('VALIDATION_ERROR', 'property_id is required', 400));
        if (!scheduled_at) return next(new AppError('VALIDATION_ERROR', 'scheduled_at is required', 400));
        const property = await db.Property.findByPk(property_id);
        if (!property) return next(new AppError('NOT_FOUND', 'Property not found', 404));
        const viewing = await db.Viewing.create({
            org_id: req.user.orgId,
            property_id,
            agent_id: agent_id || property.agent_id || null,
            user_id: req.user.id,
            user_name: user_name || null,
            user_email: user_email || null,
            user_phone: user_phone || null,
            scheduled_at,
            duration_min: duration_min || 60,
            notes: notes || null,
            status: 'pending',
        });
        return sendSuccess(req, res, viewing, 201);
    } catch (e) { return next(e); }
};

const getViewing = async (req, res, next) => {
    try {
        const viewing = await db.Viewing.findByPk(req.params.id, {
            include: [
                { model: db.Property, as: 'property', required: false },
                { model: db.Agent, as: 'agent', attributes: ['id', 'name', 'email', 'phone'], required: false },
            ],
        });
        if (!viewing) return next(new AppError('NOT_FOUND', 'Viewing not found', 404));
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r)) && viewing.user_id !== req.user.id && String(viewing.org_id) !== String(req.user.orgId)) {
            return next(new AppError('FORBIDDEN', 'Access denied', 403));
        }
        return sendSuccess(req, res, viewing);
    } catch (e) { return next(e); }
};

const updateViewing = async (req, res, next) => {
    try {
        const viewing = await db.Viewing.findByPk(req.params.id);
        if (!viewing) return next(new AppError('NOT_FOUND', 'Viewing not found', 404));
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r)) && viewing.user_id !== req.user.id && String(viewing.org_id) !== String(req.user.orgId)) {
            return next(new AppError('FORBIDDEN', 'Access denied', 403));
        }
        const { status, notes, scheduled_at, duration_min } = req.body;
        const updates = {};
        if (status) updates.status = status;
        if (notes !== undefined) updates.notes = notes;
        if (scheduled_at) updates.scheduled_at = scheduled_at;
        if (duration_min) updates.duration_min = duration_min;
        await viewing.update(updates);
        return sendSuccess(req, res, viewing);
    } catch (e) { return next(e); }
};

const cancelViewing = async (req, res, next) => {
    try {
        const viewing = await db.Viewing.findByPk(req.params.id);
        if (!viewing) return next(new AppError('NOT_FOUND', 'Viewing not found', 404));
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r)) && viewing.user_id !== req.user.id && String(viewing.org_id) !== String(req.user.orgId)) {
            return next(new AppError('FORBIDDEN', 'Access denied', 403));
        }
        await viewing.update({ status: 'cancelled' });
        return sendSuccess(req, res, { message: 'Viewing cancelled' });
    } catch (e) { return next(e); }
};

const submitFeedback = async (req, res, next) => {
    try {
        const viewing = await db.Viewing.findByPk(req.params.id);
        if (!viewing) return next(new AppError('NOT_FOUND', 'Viewing not found', 404));
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r)) && viewing.user_id !== req.user.id && String(viewing.org_id) !== String(req.user.orgId)) {
            return next(new AppError('FORBIDDEN', 'Access denied', 403));
        }
        const { feedback, rating } = req.body;
        await viewing.update({ feedback: feedback || null, rating: rating || null, status: 'completed' });
        return sendSuccess(req, res, viewing);
    } catch (e) { return next(e); }
};

module.exports = {
    listViewings,
    scheduleViewing,
    getViewing,
    updateViewing,
    cancelViewing,
    submitFeedback,
};
