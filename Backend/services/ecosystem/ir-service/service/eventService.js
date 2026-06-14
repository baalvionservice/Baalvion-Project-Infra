'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listEvents = async (orgId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.IrEvent.findAndCountAll({
        where: { org_id: orgId },
        order: [['scheduled_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createEvent = (orgId, userId, data) => db.IrEvent.create({ ...data, org_id: orgId, created_by: userId });

const getEvent = async (id, orgId) => {
    const e = await db.IrEvent.findOne({ where: { id, org_id: orgId } });
    if (!e) throw new AppError('NOT_FOUND', 'Event not found', 404);
    return e;
};

const updateEvent = async (id, orgId, data) => {
    const e = await db.IrEvent.findOne({ where: { id, org_id: orgId } });
    if (!e) throw new AppError('NOT_FOUND', 'Event not found', 404);
    await e.update(data);
    return e;
};

const deleteEvent = async (id, orgId) => {
    const e = await db.IrEvent.findOne({ where: { id, org_id: orgId } });
    if (!e) throw new AppError('NOT_FOUND', 'Event not found', 404);
    await e.destroy();
};

module.exports = { listEvents, createEvent, getEvent, updateEvent, deleteEvent };
