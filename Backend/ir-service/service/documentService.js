'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listDocuments = async (orgId, isAuth, { page, limit }) => {
    const offset = (page - 1) * limit;
    const where = { org_id: orgId };
    if (!isAuth) where.is_public = true;
    const { count, rows } = await db.IrDocument.findAndCountAll({
        where,
        order: [['published_at', 'DESC'], ['created_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createDocument = async (orgId, userId, data) => {
    return db.IrDocument.create({ ...data, org_id: orgId, uploaded_by: userId });
};

const getDocument = async (id, orgId) => {
    const doc = await db.IrDocument.findOne({ where: { id, org_id: orgId } });
    if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);
    return doc;
};

const updateDocument = async (id, orgId, data) => {
    const doc = await db.IrDocument.findOne({ where: { id, org_id: orgId } });
    if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);
    await doc.update(data);
    return doc;
};

const deleteDocument = async (id, orgId) => {
    const doc = await db.IrDocument.findOne({ where: { id, org_id: orgId } });
    if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);
    await doc.destroy();
};

module.exports = { listDocuments, createDocument, getDocument, updateDocument, deleteDocument };
