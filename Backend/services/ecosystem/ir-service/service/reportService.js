'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listReports = async (orgId, isAuth, { page, limit }) => {
    const offset = (page - 1) * limit;
    const where = { org_id: orgId };
    if (!isAuth) where.status = 'published';
    const { count, rows } = await db.Report.findAndCountAll({
        where,
        order: [['period_year', 'DESC'], ['period_quarter', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createReport = async (orgId, userId, data) => {
    return db.Report.create({ ...data, org_id: orgId, created_by: userId });
};

const getReport = async (id, orgId) => {
    const report = await db.Report.findOne({ where: { id, org_id: orgId } });
    if (!report) throw new AppError('NOT_FOUND', 'Report not found', 404);
    return report;
};

const updateReport = async (id, orgId, data) => {
    const report = await db.Report.findOne({ where: { id, org_id: orgId } });
    if (!report) throw new AppError('NOT_FOUND', 'Report not found', 404);
    await report.update(data);
    return report;
};

const deleteReport = async (id, orgId) => {
    const report = await db.Report.findOne({ where: { id, org_id: orgId } });
    if (!report) throw new AppError('NOT_FOUND', 'Report not found', 404);
    await report.destroy();
};

const publishReport = async (id, orgId) => {
    const report = await db.Report.findOne({ where: { id, org_id: orgId } });
    if (!report) throw new AppError('NOT_FOUND', 'Report not found', 404);
    if (report.status === 'published') throw new AppError('CONFLICT', 'Report already published', 409);
    await report.update({ status: 'published', published_at: new Date() });
    return report;
};

module.exports = { listReports, createReport, getReport, updateReport, deleteReport, publishReport };
