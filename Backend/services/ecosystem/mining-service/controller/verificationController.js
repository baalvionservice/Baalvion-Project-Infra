'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const getVerification = async (req, res, next) => {
    try {
        const record = await db.CompanyVerification.findOne({ where: { org_id: req.user.orgId } });
        if (!record) return next(new AppError('NOT_FOUND', 'Verification record not found', 404));
        return sendSuccess(req, res, record);
    } catch (err) { return next(err); }
};

const submitVerification = async (req, res, next) => {
    try {
        const [record, created] = await db.CompanyVerification.findOrCreate({
            where: { org_id: req.user.orgId },
            defaults: { ...req.body, org_id: req.user.orgId, status: 'pending' },
        });
        if (!created) {
            await record.update({ ...req.body, status: 'pending', rejection_reason: null });
        }
        return sendSuccess(req, res, record, created ? 201 : 200);
    } catch (err) { return next(err); }
};

const approveVerification = async (req, res, next) => {
    try {
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r))) return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const { org_id } = req.body;
        if (!org_id) return next(new AppError('VALIDATION_ERROR', 'org_id is required', 422));
        const record = await db.CompanyVerification.findOne({ where: { org_id } });
        if (!record) return next(new AppError('NOT_FOUND', 'Verification record not found', 404));
        await record.update({ status: 'verified', verified_by: req.user.id, verified_at: new Date(), rejection_reason: null });
        return sendSuccess(req, res, record);
    } catch (err) { return next(err); }
};

const rejectVerification = async (req, res, next) => {
    try {
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r))) return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const { org_id, rejection_reason } = req.body;
        if (!org_id) return next(new AppError('VALIDATION_ERROR', 'org_id is required', 422));
        const record = await db.CompanyVerification.findOne({ where: { org_id } });
        if (!record) return next(new AppError('NOT_FOUND', 'Verification record not found', 404));
        await record.update({ status: 'rejected', rejection_reason: rejection_reason || null });
        return sendSuccess(req, res, record);
    } catch (err) { return next(err); }
};

module.exports = { getVerification, submitVerification, approveVerification, rejectVerification };
