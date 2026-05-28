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

const listAgents = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.org_id) where.org_id = req.query.org_id;
        if (req.query.status) where.status = req.query.status;
        if (req.query.specialization) {
            where.specialization = { [Op.contains]: [req.query.specialization] };
        }
        const { count, rows } = await db.Agent.findAndCountAll({
            where,
            limit,
            offset,
            order: [['rating', 'DESC'], ['name', 'ASC']],
        });
        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (e) { return next(e); }
};

const createAgent = async (req, res, next) => {
    try {
        const agent = await db.Agent.create({ ...req.body, org_id: req.user.orgId });
        return sendSuccess(req, res, agent, 201);
    } catch (e) { return next(e); }
};

const getAgent = async (req, res, next) => {
    try {
        const agent = await db.Agent.findByPk(req.params.id, {
            include: [
                {
                    model: db.Property,
                    as: 'properties',
                    where: { status: 'active' },
                    required: false,
                    limit: 10,
                    order: [['created_at', 'DESC']],
                    include: [{ model: db.PropertyImage, as: 'images', where: { is_cover: true }, required: false }],
                },
            ],
        });
        if (!agent) return next(new AppError('NOT_FOUND', 'Agent not found', 404));
        return sendSuccess(req, res, agent);
    } catch (e) { return next(e); }
};

const updateAgent = async (req, res, next) => {
    try {
        const agent = await db.Agent.findByPk(req.params.id);
        if (!agent) return next(new AppError('NOT_FOUND', 'Agent not found', 404));
        await agent.update(req.body);
        return sendSuccess(req, res, agent);
    } catch (e) { return next(e); }
};

const deleteAgent = async (req, res, next) => {
    try {
        const agent = await db.Agent.findByPk(req.params.id);
        if (!agent) return next(new AppError('NOT_FOUND', 'Agent not found', 404));
        await agent.update({ status: 'inactive' });
        return sendSuccess(req, res, { message: 'Agent deactivated' });
    } catch (e) { return next(e); }
};

const getAgentProperties = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const agent = await db.Agent.findByPk(req.params.id);
        if (!agent) return next(new AppError('NOT_FOUND', 'Agent not found', 404));
        const { count, rows } = await db.Property.findAndCountAll({
            where: { agent_id: agent.id },
            include: [{ model: db.PropertyImage, as: 'images', where: { is_cover: true }, required: false }],
            limit,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (e) { return next(e); }
};

module.exports = {
    listAgents,
    createAgent,
    getAgent,
    updateAgent,
    deleteAgent,
    getAgentProperties,
};
