'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const createMessage = async (orgId, data) => {
    return db.IrContactMessage.create({ ...data, org_id: orgId, status: 'new' });
};

const listMessages = async (orgId, { page, limit, status }) => {
    const offset = (page - 1) * limit;
    const where = { org_id: orgId };
    if (status) where.status = status;
    const { count, rows } = await db.IrContactMessage.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const updateMessageStatus = async (id, orgId, status) => {
    const msg = await db.IrContactMessage.findOne({ where: { id, org_id: orgId } });
    if (!msg) throw new AppError('NOT_FOUND', 'Message not found', 404);
    await msg.update({ status });
    return msg;
};

module.exports = { createMessage, listMessages, updateMessageStatus };
