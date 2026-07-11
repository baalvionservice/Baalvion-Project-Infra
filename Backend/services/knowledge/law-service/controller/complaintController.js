'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// Any authenticated user (client or lawyer) can file a complaint against a
// lawyer. Management (status changes, resolution) is admin-only, via the
// generic /admin/complaints resource registry.
const createComplaint = async (req, res, next) => {
    try {
        const { subject_lawyer_id, category, description } = req.body || {};
        if (!description) return next(new AppError('VALIDATION_ERROR', 'description is required', 422));
        if (subject_lawyer_id) {
            const lawyer = await db.Lawyer.findByPk(Number(subject_lawyer_id));
            if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        }
        const complaint = await db.Complaint.create({
            reporter_user_id: String(req.user.id),
            subject_lawyer_id: subject_lawyer_id ? Number(subject_lawyer_id) : null,
            category: category || 'other',
            description,
        });
        return sendSuccess(req, res, complaint, 201);
    } catch (err) { return next(err); }
};

// The reporting user's own complaint history.
const listMyComplaints = async (req, res, next) => {
    try {
        const complaints = await db.Complaint.findAll({
            where: { reporter_user_id: String(req.user.id) },
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, complaints);
    } catch (err) { return next(err); }
};

module.exports = { createComplaint, listMyComplaints };
