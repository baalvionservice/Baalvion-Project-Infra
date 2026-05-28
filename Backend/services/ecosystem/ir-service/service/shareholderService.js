'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listShareholders = async (orgId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Shareholder.findAndCountAll({
        where: { org_id: orgId },
        order: [['ownership_pct', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createShareholder = async (orgId, data) => {
    return db.Shareholder.create({ ...data, org_id: orgId });
};

const updateShareholder = async (id, orgId, data) => {
    const sh = await db.Shareholder.findOne({ where: { id, org_id: orgId } });
    if (!sh) throw new AppError('NOT_FOUND', 'Shareholder not found', 404);
    await sh.update(data);
    return sh;
};

const deleteShareholder = async (id, orgId) => {
    const sh = await db.Shareholder.findOne({ where: { id, org_id: orgId } });
    if (!sh) throw new AppError('NOT_FOUND', 'Shareholder not found', 404);
    await sh.destroy();
};

module.exports = { listShareholders, createShareholder, updateShareholder, deleteShareholder };
