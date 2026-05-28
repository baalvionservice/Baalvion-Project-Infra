'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 30, unread } = req.query;
        const where = { user_id: String(req.user.id) };
        if (unread === 'true') where.read = false;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Notification.findAndCountAll({
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

const markRead = async (req, res, next) => {
    try {
        const notification = await db.Notification.findOne({
            where: { id: req.params.id, user_id: String(req.user.id) },
        });
        if (!notification) return next(new AppError('NOT_FOUND', 'Notification not found', 404));
        await notification.update({ read: true });
        return sendSuccess(req, res, notification);
    } catch (err) { return next(err); }
};

const markAllRead = async (req, res, next) => {
    try {
        const [count] = await db.Notification.update(
            { read: true },
            { where: { user_id: String(req.user.id), read: false } }
        );
        return sendSuccess(req, res, { updated: count });
    } catch (err) { return next(err); }
};

const deleteNotification = async (req, res, next) => {
    try {
        const notification = await db.Notification.findOne({
            where: { id: req.params.id, user_id: String(req.user.id) },
        });
        if (!notification) return next(new AppError('NOT_FOUND', 'Notification not found', 404));
        await notification.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listNotifications, markRead, markAllRead, deleteNotification };
