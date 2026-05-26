'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

exports.listNotifications = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const userId = req.user.id;
        const { page, limit, read } = req.query;
        const where = { org_id: orgId, user_id: userId };
        if (read !== undefined) where.read = read === 'true';

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.Notification.findAndCountAll({
            where,
            limit: lim,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await db.Notification.findOne({
            where: { id, org_id: req.user.orgId, user_id: req.user.id },
        });
        if (!notification) return next(new AppError('NOT_FOUND', 'Notification not found', 404));
        await notification.update({ read: true });
        return sendSuccess(req, res, notification);
    } catch (err) { return next(err); }
};

exports.createNotification = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { user_id, title, message, type, link } = req.body;
        if (!user_id || !title) return next(new AppError('VALIDATION_ERROR', 'user_id and title are required', 400));
        const notification = await db.Notification.create({ org_id: orgId, user_id, title, message, type, link });
        return sendSuccess(req, res, notification, 201);
    } catch (err) { return next(err); }
};
