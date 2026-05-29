'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

let _queues;
const getQueues = () => { if (!_queues) { try { _queues = require('../queues'); } catch { _queues = null; } } return _queues; };

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});
const orgOf = (req) => req.auth.orgId;

// ════════════════════════════════════════════════════════════════════════════
// Offers
// ════════════════════════════════════════════════════════════════════════════
const offerInclude = [{
    model: db.Application, as: 'application',
    include: [
        { model: db.Candidate, as: 'candidate', attributes: ['id', 'full_name', 'email'] },
        { model: db.JobListing, as: 'job', attributes: ['id', 'title'] },
    ],
}];
const serializeOffer = (o) => {
    const j = o.toJSON ? o.toJSON() : o;
    return {
        ...j,
        candidateName: j.application?.candidate?.full_name,
        position: j.application?.job?.title,
        createdAt: j.created_at,
        validUntil: j.valid_until,
    };
};

const listOffers = async (req, res, next) => {
    try {
        const { applicationId, candidateId, status } = req.query;
        const where = { org_id: orgOf(req) };
        if (applicationId) where.application_id = applicationId;
        if (candidateId) where.candidate_id = candidateId;
        if (status) where.status = status;
        const rows = await db.Offer.findAll({ where, include: offerInclude, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, rows.map(serializeOffer));
    } catch (err) { return next(err); }
};

const getOffer = async (req, res, next) => {
    try {
        const offer = await db.Offer.findOne({ where: { id: req.params.id, org_id: orgOf(req) }, include: offerInclude });
        if (!offer) throw new AppError('NOT_FOUND', 'Offer not found', 404);
        return sendSuccess(req, res, serializeOffer(offer));
    } catch (err) { return next(err); }
};

const getOfferForApplication = async (req, res, next) => {
    try {
        const offer = await db.Offer.findOne({
            where: { application_id: req.params.id, org_id: orgOf(req) },
            include: offerInclude, order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, offer ? serializeOffer(offer) : null);
    } catch (err) { return next(err); }
};

const createOffer = async (req, res, next) => {
    try {
        const b = req.body || {};
        const applicationId = b.applicationId || b.application_id;
        if (!applicationId) throw new AppError('VALIDATION_ERROR', 'applicationId is required', 422);
        const app = await db.Application.findOne({ where: { id: applicationId, org_id: orgOf(req) } });
        if (!app) throw new AppError('NOT_FOUND', 'Application not found', 404);
        const offer = await db.Offer.create({
            org_id: orgOf(req), application_id: applicationId, candidate_id: app.candidate_id,
            base_salary: b.baseSalary ?? b.base_salary ?? 0,
            equity_value: b.equityValue ?? b.equity_value ?? 0,
            bonus: b.bonus ?? 0, currency: b.currency || 'INR',
            status: b.status || 'PENDING_APPROVAL', approvals: b.approvals || [],
            valid_until: b.validUntil || b.valid_until || null, created_by: b.userId || req.auth.userId,
        });
        return sendSuccess(req, res, serializeOffer(await db.Offer.findByPk(offer.id, { include: offerInclude })), 201);
    } catch (err) { return next(err); }
};

const updateOfferStatus = async (req, res, next) => {
    try {
        const offer = await db.Offer.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!offer) throw new AppError('NOT_FOUND', 'Offer not found', 404);
        const updates = {};
        if (req.body.status) updates.status = req.body.status;
        if (req.body.approvals) updates.approvals = req.body.approvals;
        if (req.body.approverId) {
            const approvals = [...(offer.approvals || []), { approverId: req.body.approverId, status: 'Approved', timestamp: new Date() }];
            updates.approvals = approvals;
        }
        await offer.update(updates);
        return sendSuccess(req, res, serializeOffer(await db.Offer.findByPk(offer.id, { include: offerInclude })));
    } catch (err) { return next(err); }
};

const respondToOffer = async (req, res, next) => {
    try {
        const offer = await db.Offer.findOne({ where: { id: req.params.id, org_id: orgOf(req) }, include: offerInclude });
        if (!offer) throw new AppError('NOT_FOUND', 'Offer not found', 404);
        const response = (req.body.response || '').toUpperCase();
        if (!['ACCEPTED', 'REJECTED'].includes(response)) throw new AppError('VALIDATION_ERROR', 'response must be ACCEPTED or REJECTED', 422);
        await offer.update({ status: response });
        // Reflect on the application
        if (offer.application) await offer.application.update({ status: response === 'ACCEPTED' ? 'hired' : 'rejected', hired_at: response === 'ACCEPTED' ? new Date() : null });
        return sendSuccess(req, res, serializeOffer(await db.Offer.findByPk(offer.id, { include: offerInclude })));
    } catch (err) { return next(err); }
};

const deleteOffer = async (req, res, next) => {
    try {
        const offer = await db.Offer.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!offer) throw new AppError('NOT_FOUND', 'Offer not found', 404);
        await offer.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

// sendOffer — POST /applications/:id/offer
const sendOfferForApplication = async (req, res, next) => {
    try {
        const app = await db.Application.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!app) throw new AppError('NOT_FOUND', 'Application not found', 404);
        let offer = await db.Offer.findOne({ where: { application_id: app.id, org_id: orgOf(req) }, order: [['created_at', 'DESC']] });
        if (offer) { await offer.update({ status: 'SENT' }); }
        else {
            offer = await db.Offer.create({
                org_id: orgOf(req), application_id: app.id, candidate_id: app.candidate_id,
                base_salary: req.body.baseSalary ?? app.offered_salary ?? 0, currency: req.body.currency || 'INR',
                status: 'SENT', created_by: req.auth.userId,
            });
        }
        await app.update({ status: 'offer' });
        return sendSuccess(req, res, serializeOffer(await db.Offer.findByPk(offer.id, { include: offerInclude })), 201);
    } catch (err) { return next(err); }
};

// ════════════════════════════════════════════════════════════════════════════
// System users (ATS team)
// ════════════════════════════════════════════════════════════════════════════
const listUsers = async (req, res, next) => {
    try {
        const rows = await db.SystemUser.findAll({ where: { org_id: orgOf(req) }, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};
const getUser = async (req, res, next) => {
    try {
        const u = await db.SystemUser.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!u) throw new AppError('NOT_FOUND', 'User not found', 404);
        return sendSuccess(req, res, u);
    } catch (err) { return next(err); }
};
const createUser = async (req, res, next) => {
    try {
        const { name, email, phone, role } = req.body;
        if (!name || !email) throw new AppError('VALIDATION_ERROR', 'name and email are required', 422);
        const u = await db.SystemUser.create({ org_id: orgOf(req), name, email, phone, role: role || 'RECRUITER' });
        return sendSuccess(req, res, u, 201);
    } catch (err) { return next(err); }
};
const updateUser = async (req, res, next) => {
    try {
        const u = await db.SystemUser.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!u) throw new AppError('NOT_FOUND', 'User not found', 404);
        ['name', 'email', 'phone', 'role', 'status'].forEach(f => { if (req.body[f] !== undefined) u[f] = req.body[f]; });
        await u.save();
        return sendSuccess(req, res, u);
    } catch (err) { return next(err); }
};
const deleteUser = async (req, res, next) => {
    try {
        const u = await db.SystemUser.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!u) throw new AppError('NOT_FOUND', 'User not found', 404);
        await u.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

// ════════════════════════════════════════════════════════════════════════════
// Organizations
// ════════════════════════════════════════════════════════════════════════════
const listOrganizations = async (req, res, next) => {
    try {
        const orgId = orgOf(req);
        let org = await db.Organization.findByPk(orgId);
        if (!org) org = await db.Organization.create({ id: orgId, name: 'My Workspace', slug: 'my-workspace', plan: 'PRO' });
        return sendSuccess(req, res, [org]);
    } catch (err) { return next(err); }
};

// ════════════════════════════════════════════════════════════════════════════
// Payments
// ════════════════════════════════════════════════════════════════════════════
const listPayments = async (req, res, next) => {
    try {
        const where = { org_id: orgOf(req) };
        if (req.query.status) where.status = req.query.status;
        const rows = await db.Payment.findAll({ where, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};
const updatePaymentStatus = async (req, res, next) => {
    try {
        const p = await db.Payment.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!p) throw new AppError('NOT_FOUND', 'Payment not found', 404);
        const status = req.body.status;
        if (!['APPROVED', 'REJECTED', 'PAID', 'PENDING_APPROVAL'].includes(status)) throw new AppError('VALIDATION_ERROR', 'invalid status', 422);
        await p.update({ status });
        return sendSuccess(req, res, p);
    } catch (err) { return next(err); }
};

// ════════════════════════════════════════════════════════════════════════════
// Notifications
// ════════════════════════════════════════════════════════════════════════════
const listNotifications = async (req, res, next) => {
    try {
        const where = { org_id: orgOf(req) };
        if (req.query.candidateId) where.candidate_id = req.query.candidateId;
        if (req.query.userId) where.user_id = req.query.userId;
        const rows = await db.Notification.findAll({ where, order: [['created_at', 'DESC']], limit: 100 });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};
const createNotification = async (req, res, next) => {
    try {
        const { userId, candidateId, title, message, type, link } = req.body;
        const n = await db.Notification.create({
            org_id: orgOf(req), user_id: userId || null, candidate_id: candidateId || null,
            title: title || 'Notification', message, type: type || 'INFO', link,
        });
        return sendSuccess(req, res, n, 201);
    } catch (err) { return next(err); }
};
const markNotificationRead = async (req, res, next) => {
    try {
        const n = await db.Notification.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!n) throw new AppError('NOT_FOUND', 'Notification not found', 404);
        await n.update({ read: true });
        return sendSuccess(req, res, n);
    } catch (err) { return next(err); }
};
const markAllNotificationsRead = async (req, res, next) => {
    try {
        const [updated] = await db.Notification.update({ read: true }, { where: { org_id: orgOf(req), read: false } });
        return sendSuccess(req, res, { updated });
    } catch (err) { return next(err); }
};
const sendEmail = async (req, res, next) => {
    try {
        const { email, to, subject, body } = req.body;
        const recipient = to || email;
        try { getQueues()?.enqueueEmail('generic', { to: recipient, data: { subject, body } }); } catch {}
        return sendSuccess(req, res, { queued: true, to: recipient });
    } catch (err) { return next(err); }
};

// ════════════════════════════════════════════════════════════════════════════
// Documents
// ════════════════════════════════════════════════════════════════════════════
const listDocuments = async (req, res, next) => {
    try {
        const where = { org_id: orgOf(req) };
        if (req.query.candidateId) where.candidate_id = req.query.candidateId;
        if (req.query.includeDeleted !== 'true') where.status = { [Op.ne]: 'DELETED' };
        const rows = await db.Document.findAll({ where, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};
const listCandidateDocuments = async (req, res, next) => {
    try {
        const rows = await db.Document.findAll({
            where: { org_id: orgOf(req), candidate_id: req.params.id, status: { [Op.ne]: 'DELETED' } },
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};
const createDocument = async (req, res, next) => {
    try {
        const b = req.body || {};
        const doc = await db.Document.create({
            org_id: orgOf(req), candidate_id: b.candidateId || b.candidate_id,
            document_type: b.documentType || b.document_type, file_name: b.fileName || b.file_name,
            file_url: b.fileUrl || b.file_url, country: b.country, issue_date: b.issueDate || b.issue_date,
            status: b.status || 'PENDING', uploaded_by: req.auth.userId,
        });
        return sendSuccess(req, res, doc, 201);
    } catch (err) { return next(err); }
};
const updateDocument = async (req, res, next) => {
    try {
        const doc = await db.Document.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);
        if (req.body.status) await doc.update({ status: req.body.status });
        else await doc.update({ status: 'DELETION_REQUESTED' });
        return sendSuccess(req, res, doc);
    } catch (err) { return next(err); }
};
const deleteDocument = async (req, res, next) => {
    try {
        const doc = await db.Document.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);
        await doc.update({ status: 'DELETED' }); // soft delete
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

// ════════════════════════════════════════════════════════════════════════════
// Notes
// ════════════════════════════════════════════════════════════════════════════
const listNotes = async (req, res, next) => {
    try {
        const candidateId = req.query.candidateId || req.params.id;
        const where = { org_id: orgOf(req) };
        if (candidateId) where.candidate_id = candidateId;
        const rows = await db.Note.findAll({ where, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};
const createNote = async (req, res, next) => {
    try {
        const b = req.body || {};
        const candidateId = b.candidateId || b.candidate_id;
        if (!candidateId || !b.content) throw new AppError('VALIDATION_ERROR', 'candidateId and content are required', 422);
        const note = await db.Note.create({
            org_id: orgOf(req), candidate_id: candidateId, content: b.content,
            author_id: b.authorId || req.auth.userId, author_name: b.authorName,
        });
        return sendSuccess(req, res, note, 201);
    } catch (err) { return next(err); }
};

// ════════════════════════════════════════════════════════════════════════════
// Audit
// ════════════════════════════════════════════════════════════════════════════
const logEvent = async (req, res, next) => {
    try {
        const b = req.body || {};
        const log = await db.AuditLog.create({
            org_id: orgOf(req), actor_id: b.actorId || req.auth.userId, actor_name: b.actorName || b.actor,
            action: b.action || b.event || 'event', entity_type: b.entityType || b.entity_type,
            entity_id: b.entityId || b.entity_id ? String(b.entityId || b.entity_id) : null,
            details: b.details || b.metadata || {}, ip: req.ip,
        });
        return sendSuccess(req, res, log, 201);
    } catch (err) { return next(err); }
};
const getAuditLogs = async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit || 100), 500);
        const where = { org_id: orgOf(req) };
        if (req.query.action) where.action = { [Op.iLike]: `%${req.query.action}%` };
        if (req.query.entityType) where.entity_type = req.query.entityType;
        const rows = await db.AuditLog.findAll({ where, order: [['created_at', 'DESC']], limit });
        return sendSuccess(req, res, { logs: rows });
    } catch (err) { return next(err); }
};

// ════════════════════════════════════════════════════════════════════════════
// Projects + milestones
// ════════════════════════════════════════════════════════════════════════════
const listProjects = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, clientId, contractorId, search } = req.query;
        const where = { org_id: orgOf(req) };
        if (status) where.status = status;
        if (clientId) where.client_id = clientId;
        if (contractorId) where.contractor_id = contractorId;
        if (search) where.title = { [Op.iLike]: `%${search}%` };
        const { rows, count } = await db.Project.findAndCountAll({
            where, ...paginate(page, limit), order: [['created_at', 'DESC']],
        });
        const lm = Math.min(Number(limit), 100);
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: lm, totalPages: Math.ceil(count / lm) },
        });
    } catch (err) { return next(err); }
};
const getProject = async (req, res, next) => {
    try {
        const p = await db.Project.findOne({
            where: { id: req.params.id, org_id: orgOf(req) },
            include: [{ model: db.Milestone, as: 'milestones', separate: true, order: [['order_index', 'ASC']] }],
        });
        if (!p) throw new AppError('NOT_FOUND', 'Project not found', 404);
        return sendSuccess(req, res, p);
    } catch (err) { return next(err); }
};
const createProject = async (req, res, next) => {
    try {
        const b = req.body || {};
        if (!b.title) throw new AppError('VALIDATION_ERROR', 'title is required', 422);
        const p = await db.Project.create({
            org_id: orgOf(req), title: b.title, description: b.description, category: b.category,
            status: b.status || 'OPEN', required_skills: b.requiredSkills || b.required_skills || [],
            budget: b.budget, currency: b.currency || 'USD', country: b.country, owner: b.owner,
            client_id: b.clientId || b.client_id, contractor_id: b.contractorId || b.contractor_id,
            start_date: b.startDate || b.start_date, end_date: b.endDate || b.end_date,
            max_team_size: b.maxTeamSize || b.max_team_size, roles: b.roles || [],
        });
        return sendSuccess(req, res, p, 201);
    } catch (err) { return next(err); }
};
const updateProjectStatus = async (req, res, next) => {
    try {
        const p = await db.Project.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!p) throw new AppError('NOT_FOUND', 'Project not found', 404);
        if (req.body.status) p.status = req.body.status;
        ['title', 'description', 'category', 'budget', 'owner'].forEach(f => { if (req.body[f] !== undefined) p[f] = req.body[f]; });
        await p.save();
        return sendSuccess(req, res, p);
    } catch (err) { return next(err); }
};
const listMilestones = async (req, res, next) => {
    try {
        const rows = await db.Milestone.findAll({ where: { org_id: orgOf(req), project_id: req.params.id }, order: [['order_index', 'ASC']] });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};
const createMilestone = async (req, res, next) => {
    try {
        const b = req.body || {};
        if (!b.title) throw new AppError('VALIDATION_ERROR', 'title is required', 422);
        const ms = await db.Milestone.create({
            org_id: orgOf(req), project_id: req.params.id, title: b.title, description: b.description,
            status: b.status || 'pending', amount: b.amount, due_date: b.dueDate || b.due_date, order_index: b.orderIndex || 0,
        });
        return sendSuccess(req, res, ms, 201);
    } catch (err) { return next(err); }
};
const updateMilestone = async (req, res, next) => {
    try {
        const ms = await db.Milestone.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
        if (!ms) throw new AppError('NOT_FOUND', 'Milestone not found', 404);
        ['title', 'description', 'status', 'amount', 'order_index'].forEach(f => { if (req.body[f] !== undefined) ms[f] = req.body[f]; });
        if (req.body.dueDate !== undefined) ms.due_date = req.body.dueDate;
        await ms.save();
        return sendSuccess(req, res, ms);
    } catch (err) { return next(err); }
};

module.exports = {
    // offers
    listOffers, getOffer, getOfferForApplication, createOffer, updateOfferStatus, respondToOffer, deleteOffer, sendOfferForApplication,
    // users
    listUsers, getUser, createUser, updateUser, deleteUser,
    // organizations
    listOrganizations,
    // payments
    listPayments, updatePaymentStatus,
    // notifications
    listNotifications, createNotification, markNotificationRead, markAllNotificationsRead, sendEmail,
    // documents
    listDocuments, listCandidateDocuments, createDocument, updateDocument, deleteDocument,
    // notes
    listNotes, createNote,
    // audit
    logEvent, getAuditLogs,
    // projects
    listProjects, getProject, createProject, updateProjectStatus, listMilestones, createMilestone, updateMilestone,
};
