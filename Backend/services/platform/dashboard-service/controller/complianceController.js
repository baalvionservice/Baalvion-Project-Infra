'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

async function _createAuditLog(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId,
            action,
            entity_type,
            entity_id,
            user_id: req.user.id,
            role: req.user.role,
            resource: req.originalUrl,
            ip_address: req.ip,
            status: 'Success',
            severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

exports.listCompliance = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit, business_id } = req.query;
        const where = { org_id: orgId };
        if (business_id) where.business_id = Number(business_id);

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.ComplianceRecord.findAndCountAll({
            where,
            include: [{ model: db.Domain, as: 'business', attributes: ['id', 'name'], required: false }],
            limit: lim,
            offset,
            order: [['country', 'ASC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.getComplianceByCountry = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { country_id } = req.params;
        const records = await db.ComplianceRecord.findAll({
            where: { org_id: orgId, country_id },
            include: [{ model: db.Domain, as: 'business', attributes: ['id', 'name'], required: false }],
        });
        if (!records.length) return next(new AppError('NOT_FOUND', 'No compliance records found for this country', 404));
        return sendSuccess(req, res, records);
    } catch (err) { return next(err); }
};

exports.createCompliance = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { country_id, country, business_id, tax_status, tax_status_code, vat_gst, licenses, data_laws, employment_law, overall_score, action_items } = req.body;
        const record = await db.ComplianceRecord.create({ country_id, country, business_id, tax_status, tax_status_code, vat_gst, licenses, data_laws, employment_law, overall_score, action_items, org_id: orgId });
        await _createAuditLog(req, 'CREATE_COMPLIANCE', 'compliance_record', String(record.id));
        return sendSuccess(req, res, record, 201);
    } catch (err) { return next(err); }
};

exports.updateCompliance = async (req, res, next) => {
    try {
        const record = await db.ComplianceRecord.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!record) return next(new AppError('NOT_FOUND', 'Compliance record not found', 404));
        const { country_id, country, business_id, tax_status, tax_status_code, vat_gst, licenses, data_laws, employment_law, overall_score, action_items } = req.body;
        await record.update({ country_id, country, business_id, tax_status, tax_status_code, vat_gst, licenses, data_laws, employment_law, overall_score, action_items });
        await _createAuditLog(req, 'UPDATE_COMPLIANCE', 'compliance_record', String(record.id));
        return sendSuccess(req, res, record);
    } catch (err) { return next(err); }
};
