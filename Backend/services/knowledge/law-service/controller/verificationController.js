'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const storage = require('../service/storage');
const { guardUpload } = require('@baalvion/upload/validate.js');

const DOC_TYPES = ['bar_council_certificate', 'government_id', 'professional_certificate', 'selfie'];

// Registration wizard's Verification step: real binary upload -> MinIO,
// mirrors documentController.uploadFile's guarded-upload pattern exactly.
const uploadMyVerificationDocument = async (req, res, next) => {
    try {
        if (!req.file) return next(new AppError('BAD_REQUEST', 'file is required (multipart field "file")', 400));
        const docType = String(req.body.docType || '');
        if (!DOC_TYPES.includes(docType)) {
            return next(new AppError('VALIDATION_ERROR', `docType must be one of ${DOC_TYPES.join(', ')}`, 422));
        }
        const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));

        const guard = await guardUpload(req.file.buffer, { declaredMime: req.file.mimetype, filename: req.file.originalname });
        if (!guard.ok) return next(new AppError(guard.code, guard.message, guard.status));

        const safeName = (req.file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
        const key = `verification/${lawyer.id}/${docType}/${Date.now()}-${safeName}`;
        await storage.putObject(key, req.file.buffer, req.file.mimetype);

        const doc = await db.VerificationDocument.create({
            lawyer_id: lawyer.id,
            doc_type: docType,
            storage_key: key,
            status: 'pending',
        });
        return sendSuccess(req, res, doc, 201);
    } catch (err) { return next(err); }
};

const listMyVerificationDocuments = async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const docs = await db.VerificationDocument.findAll({
            where: { lawyer_id: lawyer.id },
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, docs);
    } catch (err) { return next(err); }
};

// ── Admin verification queue ────────────────────────────────────────────────
const listVerificationQueue = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status = 'pending' } = req.query;
        const limitN = Math.min(Number(limit) || 20, 100);
        const offset = (Number(page) - 1) * limitN;
        const where = {};
        if (status && status !== 'all') where.status = status;
        const { count, rows } = await db.VerificationDocument.findAndCountAll({
            where,
            include: [{ model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email', 'country', 'city'] }],
            order: [['created_at', 'ASC']],
            limit: limitN,
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: limitN, totalPages: Math.ceil(count / limitN) },
        });
    } catch (err) { return next(err); }
};

const getVerificationDocumentDownload = async (req, res, next) => {
    try {
        const doc = await db.VerificationDocument.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Verification document not found', 404));
        const url = await storage.presignedGetUrl(doc.storage_key, 900);
        return sendSuccess(req, res, { url });
    } catch (err) { return next(err); }
};

const reviewVerificationDocument = async (req, res, next) => {
    try {
        const { status, notes } = req.body || {};
        if (!['verified', 'rejected'].includes(status)) {
            return next(new AppError('VALIDATION_ERROR', 'status must be "verified" or "rejected"', 422));
        }
        const doc = await db.VerificationDocument.findByPk(req.params.id);
        if (!doc) return next(new AppError('NOT_FOUND', 'Verification document not found', 404));
        await doc.update({
            status,
            review_notes: notes || null,
            reviewed_by: req.user.email || String(req.user.id),
            reviewed_at: new Date(),
        });

        // A lawyer is "verified" once every required document type has a
        // verified row (any rejection blocks it, even if others are verified).
        const docs = await db.VerificationDocument.findAll({ where: { lawyer_id: doc.lawyer_id } });
        const byType = new Map(docs.map((d) => [d.doc_type, d]));
        const hasAllRequired = DOC_TYPES.every((t) => byType.get(t)?.status === 'verified');
        const hasAnyRejected = docs.some((d) => d.status === 'rejected');
        const lawyer = await db.Lawyer.findByPk(doc.lawyer_id);
        if (lawyer && !hasAnyRejected && hasAllRequired) {
            await lawyer.update({ verified: true });
        } else if (lawyer && hasAnyRejected) {
            await lawyer.update({ verified: false });
        }

        const { maybeActivateLawyer } = require('../service/lawyerActivation');
        const updatedLawyer = await maybeActivateLawyer(doc.lawyer_id);

        return sendSuccess(req, res, { document: doc, lawyer: updatedLawyer });
    } catch (err) { return next(err); }
};

module.exports = {
    DOC_TYPES,
    uploadMyVerificationDocument,
    listMyVerificationDocuments,
    listVerificationQueue,
    getVerificationDocumentDownload,
    reviewVerificationDocument,
};
