'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listScheduledReports = async (orgId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.ScheduledReport.findAndCountAll({
        where: { org_id: orgId },
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createScheduledReport = async (orgId, userId, data) => {
    return db.ScheduledReport.create({ ...data, org_id: orgId, created_by: userId });
};

const updateScheduledReport = async (id, orgId, data) => {
    const report = await db.ScheduledReport.findOne({ where: { id, org_id: orgId } });
    if (!report) throw new AppError('NOT_FOUND', 'Scheduled report not found', 404);
    await report.update(data);
    return report;
};

const deleteScheduledReport = async (id, orgId) => {
    const report = await db.ScheduledReport.findOne({ where: { id, org_id: orgId } });
    if (!report) throw new AppError('NOT_FOUND', 'Scheduled report not found', 404);
    await report.destroy();
};

module.exports = { listScheduledReports, createScheduledReport, updateScheduledReport, deleteScheduledReport };
