'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

async function _audit(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId, action, entity_type, entity_id,
            user_id: req.user.id, role: req.user.role, resource: req.originalUrl,
            ip_address: req.ip, status: 'Success', severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

const dateOnly = (v) => (v == null ? null : String(v).slice(0, 10));
const toView = (p) => ({
    id: p.portal_key, name: p.name, url: `/portal/${p.portal_key}`, pin: p.pin,
    includedBusinesses: p.included_businesses || [], expires: dateOnly(p.expires), investorName: p.investor_name,
});

exports.get = async (req, res, next) => {
    try {
        const rows = await db.InvestorPortal.findAll({ where: { org_id: req.user.orgId }, order: [['created_at', 'DESC']], raw: true });
        return sendSuccess(req, res, rows.map(toView));
    } catch (err) { return next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { name, pin, includedBusinesses, expires, investorName } = req.body;
        if (!name) return next(new AppError('VALIDATION_ERROR', 'name is required', 400));
        const row = await db.InvestorPortal.create({
            org_id: req.user.orgId,
            portal_key: `portal_${Math.random().toString(36).slice(2, 10)}`,
            name, pin: pin || String(Math.floor(1000 + Math.random() * 9000)),
            included_businesses: Array.isArray(includedBusinesses) ? includedBusinesses : [],
            expires: expires || null, investor_name: investorName || null,
        });
        await _audit(req, 'CREATE_PORTAL', 'investor_portal', row.portal_key);
        return sendSuccess(req, res, toView(row.get({ plain: true })), 201);
    } catch (err) { return next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        const count = await db.InvestorPortal.destroy({ where: { portal_key: req.params.portalKey, org_id: req.user.orgId } });
        if (!count) return next(new AppError('NOT_FOUND', 'Portal not found', 404));
        await _audit(req, 'DELETE_PORTAL', 'investor_portal', req.params.portalKey);
        return sendSuccess(req, res, { portalKey: req.params.portalKey, deleted: true });
    } catch (err) { return next(err); }
};
