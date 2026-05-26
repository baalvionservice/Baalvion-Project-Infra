'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const createSubmission = async (data, ip, userAgent) => {
    return db.ContactSubmission.create({ ...data, ip_address: ip, user_agent: userAgent });
};

const listSubmissions = async ({ page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.ContactSubmission.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const getSubmission = async (id) => {
    const sub = await db.ContactSubmission.findByPk(id);
    if (!sub) throw new AppError('NOT_FOUND', 'Submission not found', 404);
    if (sub.status === 'new') await sub.update({ status: 'read' });
    return sub;
};

const updateSubmission = async (id, data) => {
    const sub = await db.ContactSubmission.findByPk(id);
    if (!sub) throw new AppError('NOT_FOUND', 'Submission not found', 404);
    const updates = { ...data };
    if (data.response) {
        updates.status = 'responded';
        updates.responded_at = new Date();
    }
    await sub.update(updates);
    return sub;
};

module.exports = { createSubmission, listSubmissions, getSubmission, updateSubmission };
