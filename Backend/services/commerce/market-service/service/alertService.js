'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listAlerts = async (userId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.PriceAlert.findAndCountAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createAlert = async (userId, data) => {
    return db.PriceAlert.create({ ...data, user_id: userId });
};

const updateAlert = async (id, userId, data) => {
    const alert = await db.PriceAlert.findOne({ where: { id, user_id: userId } });
    if (!alert) throw new AppError('NOT_FOUND', 'Alert not found', 404);
    await alert.update(data);
    return alert;
};

const deleteAlert = async (id, userId) => {
    const alert = await db.PriceAlert.findOne({ where: { id, user_id: userId } });
    if (!alert) throw new AppError('NOT_FOUND', 'Alert not found', 404);
    await alert.destroy();
};

module.exports = { listAlerts, createAlert, updateAlert, deleteAlert };
