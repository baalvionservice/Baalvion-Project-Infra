'use strict';
const crypto = require('crypto');
const db = require('../models');
const { AppError } = require('../utils/errors');

// Human-friendly, collision-resistant reference, e.g. "BIZ-7F3A9C".
const genReference = () => `BIZ-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// Application approval workflow. `approved`/`rejected` are terminal.
const STATUS = Object.freeze({
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
});
const TERMINAL = new Set([STATUS.APPROVED, STATUS.REJECTED]);
const ACTION_TO_STATUS = Object.freeze({
    start_review: STATUS.UNDER_REVIEW,
    approve: STATUS.APPROVED,
    reject: STATUS.REJECTED,
});

// Pure status-transition resolver (unit-tested). Returns the next status or throws a
// CONFLICT AppError if the application is already in a terminal state.
const resolveNextStatus = (current, action) => {
    if (TERMINAL.has(current)) {
        throw new AppError('CONFLICT', `Application already ${current}`, 409);
    }
    const next = ACTION_TO_STATUS[action];
    if (!next) throw new AppError('VALIDATION_ERROR', `Unknown review action '${action}'`, 400);
    return next;
};

const docInclude = () => [{ model: db.IrBusinessDocument, as: 'documents' }];

const getApplication = async (id, orgId) => {
    const app = await db.IrBusinessApplication.findOne({
        where: { id, org_id: orgId },
        include: docInclude(),
        order: [[{ model: db.IrBusinessDocument, as: 'documents' }, 'created_at', 'ASC']],
    });
    if (!app) throw new AppError('NOT_FOUND', 'Business application not found', 404);
    return app;
};

const listApplications = async (orgId, { page, limit, status, kyc_status }) => {
    const offset = (page - 1) * limit;
    const where = { org_id: orgId };
    if (status) where.status = status;
    if (kyc_status) where.kyc_status = kyc_status;
    const { count, rows } = await db.IrBusinessApplication.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

// Create the company + KYC + tax registrations and any attached documents atomically.
// Starts the application in 'submitted' (the public funnel posts a complete application).
const createApplication = async (orgId, data) => {
    const { documents = [], ...company } = data;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const tx = await db.sequelize.transaction();
        try {
            const app = await db.IrBusinessApplication.create({
                ...company,
                org_id: orgId,
                reference: genReference(),
                status: STATUS.SUBMITTED,
                kyc_status: 'pending',
                submitted_at: new Date(),
            }, { transaction: tx });

            if (documents.length) {
                await db.IrBusinessDocument.bulkCreate(
                    documents.map((d) => ({
                        ...d,
                        application_id: app.id,
                        org_id: orgId,
                        status: 'pending',
                    })),
                    { transaction: tx },
                );
            }

            await tx.commit();
            return getApplication(app.id, orgId);
        } catch (err) {
            await tx.rollback();
            const isUnique = err?.name === 'SequelizeUniqueConstraintError';
            if (!isUnique || attempt === 2) throw err;
        }
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Could not allocate application reference', 500);
};

// Approve / reject / move-to-review. Optionally update KYC status in the same call.
const reviewApplication = async (id, orgId, { action, review_note, kyc_status }, reviewer) => {
    const app = await db.IrBusinessApplication.findOne({ where: { id, org_id: orgId } });
    if (!app) throw new AppError('NOT_FOUND', 'Business application not found', 404);

    const nextStatus = resolveNextStatus(app.status, action);
    const patch = { status: nextStatus };
    if (review_note !== undefined) patch.review_note = review_note || null;
    if (kyc_status) patch.kyc_status = kyc_status;
    if (action === 'approve' || action === 'reject') {
        patch.reviewed_by = reviewer || null;
        patch.reviewed_at = new Date();
    }
    await app.update(patch);
    return getApplication(id, orgId);
};

// --- Documents (staff-side; the public funnel sends docs nested in createApplication) ----

const assertApplication = async (applicationId, orgId) => {
    const app = await db.IrBusinessApplication.findOne({ where: { id: applicationId, org_id: orgId } });
    if (!app) throw new AppError('NOT_FOUND', 'Business application not found', 404);
    return app;
};

const listDocuments = async (applicationId, orgId) => {
    await assertApplication(applicationId, orgId);
    return db.IrBusinessDocument.findAll({
        where: { application_id: applicationId, org_id: orgId },
        order: [['created_at', 'ASC']],
    });
};

const addDocument = async (applicationId, orgId, userId, data) => {
    await assertApplication(applicationId, orgId);
    return db.IrBusinessDocument.create({
        ...data,
        application_id: applicationId,
        org_id: orgId,
        uploaded_by: userId ?? null,
        status: 'pending',
    });
};

const reviewDocument = async (applicationId, docId, orgId, { action, review_note }) => {
    const doc = await db.IrBusinessDocument.findOne({
        where: { id: docId, application_id: applicationId, org_id: orgId },
    });
    if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);
    await doc.update({
        status: action === 'verify' ? 'verified' : 'rejected',
        review_note: review_note || null,
    });
    return doc;
};

module.exports = {
    STATUS,
    resolveNextStatus,
    getApplication,
    listApplications,
    createApplication,
    reviewApplication,
    listDocuments,
    addDocument,
    reviewDocument,
};
