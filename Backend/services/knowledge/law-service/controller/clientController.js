'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listClients = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const { page = 1, limit = 20, tier } = req.query;
        const where = {};
        if (tier) where.subscription_tier = tier;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Client.findAndCountAll({
            where,
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

const getClient = async (req, res, next) => {
    try {
        const client = await db.Client.findByPk(req.params.id);
        if (!client) return next(new AppError('NOT_FOUND', 'Client not found', 404));
        if (client.user_id !== String(req.user.id) && !req.user.isAdmin) {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        return sendSuccess(req, res, client);
    } catch (err) { return next(err); }
};

const getMyProfile = async (req, res, next) => {
    try {
        const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
        if (!client) return next(new AppError('NOT_FOUND', 'Client profile not found. Please create one.', 404));
        return sendSuccess(req, res, client);
    } catch (err) { return next(err); }
};

const createClient = async (req, res, next) => {
    try {
        const existing = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
        if (existing) return next(new AppError('CONFLICT', 'Client profile already exists', 409));
        const client = await db.Client.create({ ...req.body, user_id: String(req.user.id) });
        return sendSuccess(req, res, client, 201);
    } catch (err) { return next(err); }
};

const updateClient = async (req, res, next) => {
    try {
        const client = await db.Client.findByPk(req.params.id);
        if (!client) return next(new AppError('NOT_FOUND', 'Client not found', 404));
        if (client.user_id !== String(req.user.id) && !req.user.isAdmin) {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        delete req.body.subscription_tier; // tier is changed via subscriptions
        delete req.body.user_id;
        await client.update(req.body);
        return sendSuccess(req, res, client);
    } catch (err) { return next(err); }
};

const deleteClient = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const client = await db.Client.findByPk(req.params.id);
        if (!client) return next(new AppError('NOT_FOUND', 'Client not found', 404));
        await client.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listClients, getClient, getMyProfile, createClient, updateClient, deleteClient };
