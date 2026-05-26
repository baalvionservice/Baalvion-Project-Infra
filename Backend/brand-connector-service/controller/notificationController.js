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
        const { read, page = 1, limit = 20 } = req.query;
        const where = { user_id: req.user.id, org_id: req.user.orgId };
        if (read !== undefined) where.read = read === 'true';
        where[Op.or] = [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } },
        ];
        const p = paginate(page, limit);
        const { rows, count } = await db.Notification.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.markRead = async (req, res, next) => {
    try {
        const notification = await db.Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });
        if (!notification) return next(new AppError('NOT_FOUND', 'Notification not found', 404));
        await notification.update({ read: true });
        return sendSuccess(req, res, notification);
    } catch (err) { return next(err); }
};
