'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listEarnings = async (orgId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.EarningsCall.findAndCountAll({
        where: { org_id: orgId },
        order: [['year', 'DESC'], ['quarter', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createEarnings = async (orgId, userId, data) => {
    return db.EarningsCall.create({ ...data, org_id: orgId, created_by: userId });
};

const getEarnings = async (id, orgId) => {
    const ec = await db.EarningsCall.findOne({ where: { id, org_id: orgId } });
    if (!ec) throw new AppError('NOT_FOUND', 'Earnings call not found', 404);
    return ec;
};

const updateEarnings = async (id, orgId, data) => {
    const ec = await db.EarningsCall.findOne({ where: { id, org_id: orgId } });
    if (!ec) throw new AppError('NOT_FOUND', 'Earnings call not found', 404);
    await ec.update(data);
    return ec;
};

const getTranscript = async (id, orgId) => {
    const ec = await db.EarningsCall.findOne({
        where: { id, org_id: orgId },
        attributes: ['id', 'title', 'quarter', 'year', 'transcript', 'summary'],
    });
    if (!ec) throw new AppError('NOT_FOUND', 'Earnings call not found', 404);
    return ec;
};

module.exports = { listEarnings, createEarnings, getEarnings, updateEarnings, getTranscript };
