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

const iso = (v) => (v == null ? null : new Date(v).toISOString());
const rand = (p) => `${p}_${Math.random().toString(36).slice(2, 8)}`;

exports.get = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const [cards, requests, consent, retention] = await Promise.all([
            db.GdprStatusCard.findAll({ where: { org_id: orgId }, order: [['sort_order', 'ASC']], raw: true }),
            db.GdprSubjectRequest.findAll({ where: { org_id: orgId }, order: [['submitted_at', 'DESC']], raw: true }),
            db.GdprCookieConsent.findAll({ where: { org_id: orgId }, raw: true }),
            db.GdprRetentionPolicy.findAll({ where: { org_id: orgId }, order: [['sort_order', 'ASC']], raw: true }),
        ]);
        return sendSuccess(req, res, {
            statusCards: cards.map((c) => ({ title: c.title, status: c.status, description: c.description })),
            subjectRequests: requests.map((r) => ({
                id: r.request_key, type: r.type, name: r.subject_name,
                submitted: iso(r.submitted_at), status: r.status, dueDate: iso(r.due_date),
            })),
            cookieConsent: consent.map((c) => ({ domain: c.domain, rate: Number(c.rate) })),
            retentionPolicies: retention.map((p) => ({ dataType: p.data_type, period: p.period, legalBasis: p.legal_basis })),
        });
    } catch (err) { return next(err); }
};

exports.createRequest = async (req, res, next) => {
    try {
        const { type, name, dueDate } = req.body;
        if (!type || !name) return next(new AppError('VALIDATION_ERROR', 'type and name are required', 400));
        const due = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000);
        const row = await db.GdprSubjectRequest.create({
            org_id: req.user.orgId, request_key: rand('dsr'), type, subject_name: name,
            submitted_at: new Date(), status: 'Pending', due_date: due,
        });
        await _audit(req, 'CREATE_DSR', 'gdpr_subject_request', row.request_key);
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
};

exports.updateRequest = async (req, res, next) => {
    try {
        const row = await db.GdprSubjectRequest.findOne({ where: { request_key: req.params.requestKey, org_id: req.user.orgId } });
        if (!row) return next(new AppError('NOT_FOUND', 'Request not found', 404));
        const { status } = req.body;
        if (status) await row.update({ status });
        await _audit(req, 'UPDATE_DSR', 'gdpr_subject_request', row.request_key);
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
};
