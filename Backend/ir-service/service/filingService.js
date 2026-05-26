'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listFilings = async (orgId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Filing.findAndCountAll({
        where: { org_id: orgId },
        order: [['filing_date', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createFiling = async (orgId, userId, data) => {
    return db.Filing.create({ ...data, org_id: orgId, created_by: userId });
};

const getFiling = async (id, orgId) => {
    const filing = await db.Filing.findOne({ where: { id, org_id: orgId } });
    if (!filing) throw new AppError('NOT_FOUND', 'Filing not found', 404);
    return filing;
};

const updateFiling = async (id, orgId, data) => {
    const filing = await db.Filing.findOne({ where: { id, org_id: orgId } });
    if (!filing) throw new AppError('NOT_FOUND', 'Filing not found', 404);
    await filing.update(data);
    return filing;
};

const deleteFiling = async (id, orgId) => {
    const filing = await db.Filing.findOne({ where: { id, org_id: orgId } });
    if (!filing) throw new AppError('NOT_FOUND', 'Filing not found', 404);
    await filing.destroy();
};

module.exports = { listFilings, createFiling, getFiling, updateFiling, deleteFiling };
