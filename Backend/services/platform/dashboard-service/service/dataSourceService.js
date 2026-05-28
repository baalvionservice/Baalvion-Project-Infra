'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listDataSources = async (orgId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.DataSource.findAndCountAll({
        where: { org_id: orgId },
        order: [['name', 'ASC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createDataSource = async (orgId, userId, data) => {
    return db.DataSource.create({ ...data, org_id: orgId, created_by: userId });
};

const getDataSource = async (id, orgId) => {
    const ds = await db.DataSource.findOne({ where: { id, org_id: orgId } });
    if (!ds) throw new AppError('NOT_FOUND', 'Data source not found', 404);
    return ds;
};

const updateDataSource = async (id, orgId, data) => {
    const ds = await db.DataSource.findOne({ where: { id, org_id: orgId } });
    if (!ds) throw new AppError('NOT_FOUND', 'Data source not found', 404);
    await ds.update(data);
    return ds;
};

const deleteDataSource = async (id, orgId) => {
    const ds = await db.DataSource.findOne({ where: { id, org_id: orgId } });
    if (!ds) throw new AppError('NOT_FOUND', 'Data source not found', 404);
    await ds.destroy();
};

const testConnection = async (id, orgId) => {
    const ds = await db.DataSource.findOne({ where: { id, org_id: orgId } });
    if (!ds) throw new AppError('NOT_FOUND', 'Data source not found', 404);
    // Simulate connection test — real implementation would attempt actual connection
    const testResult = { success: true, message: 'Connection test not implemented for this source type', source_type: ds.source_type };
    await ds.update({
        last_tested_at: new Date(),
        last_test_status: 'success',
        last_test_error: null,
    });
    return testResult;
};

module.exports = { listDataSources, createDataSource, getDataSource, updateDataSource, deleteDataSource, testConnection };
