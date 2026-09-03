'use strict';
// Candidate self-service ("/me/*"). Scoped to the CALLER's identity (email), NOT an org —
// a candidate owns their application data wherever they applied. Staff also have a profile.
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { ensureCandidateCode } = require('../utils/referenceCodes');
const { issueEmployeeCodeOnHire, sendMail, companyNameFor } = require('../service/candidateLifecycle');

async function candidateIdsForEmail(email) {
    if (!email) return [];
    const rows = await db.Candidate.findAll({ where: { email }, attributes: ['id'] });
    return rows.map((r) => r.id);
}

/**
 * The candidate's own record, created on first sight.
 *
 * Registration happens in auth-service, which knows nothing about the ATS — so the
 * portal profile row (and with it the Candidate ID) is provisioned here, the first
 * time a signed-in candidate asks who they are. That's what puts an ID on the
 * dashboard of someone who has registered but not yet applied.
 */
async function provisionCandidate(req) {
    const { email } = req.portal || {};
    if (!email) return null;
    let candidate = await db.Candidate.findOne({ where: { email }, order: [['created_at', 'DESC']] });
    if (!candidate) {
        candidate = await db.Candidate.create({
            email,
            full_name: (req.body && req.body.name) || null,
            org_id: req.portal.employerOrgId || req.auth.orgId || null,
            source: 'direct',
        });
    }
    await ensureCandidateCode(db.sequelize, candidate);
    req.portal.candidateId = candidate.id;
    return candidate;
}

const getMyProfile = async (req, res, next) => {
    try {
        const { role, email, candidateId, systemUserId, employerOrgId } = req.portal || {};
        let name = email;
        let candidate = null;
        if (systemUserId) {
            const s = await db.SystemUser.findByPk(systemUserId);
            if (s) name = s.name || name;
        } else {
            // Candidates (registered or applied) always resolve to a candidate row.
            candidate = candidateId ? await db.Candidate.findByPk(candidateId) : null;
            if (candidate) await ensureCandidateCode(db.sequelize, candidate);
            else candidate = await provisionCandidate(req);
            if (candidate) name = candidate.full_name || name;
        }
        return sendSuccess(req, res, {
            role: role || 'CANDIDATE',
            email,
            name,
            userId: req.auth.userId,
            candidateId: (candidate && candidate.id) || candidateId || null,
            referenceCode: candidate ? candidate.reference_code : null,
            employeeCode: candidate ? candidate.employee_code : null,
            employeeCodeIssuedAt: candidate ? candidate.employee_code_issued_at : null,
            systemUserId: systemUserId || null,
            employerOrgId: employerOrgId || null,
            candidate: candidate ? candidate.toJSON() : null,
        });
    } catch (err) { return next(err); }
};

// Candidate edits their own profile. Deliberately narrow: identity (email), the
// reference codes and the hiring status are all server-owned and not writable here.
const CANDIDATE_EDITABLE = [
    'full_name', 'phone', 'location', 'headline', 'bio',
    'linkedin_url', 'portfolio_url', 'resume_url', 'skills', 'years_of_experience',
];

const updateMyProfile = async (req, res, next) => {
    try {
        if (req.portal && req.portal.systemUserId) {
            throw new AppError('FORBIDDEN', 'Staff profiles are managed in team settings', 403);
        }
        const candidate = req.portal && req.portal.candidateId
            ? await db.Candidate.findByPk(req.portal.candidateId)
            : await provisionCandidate(req);
        if (!candidate) throw new AppError('NOT_FOUND', 'Profile not found', 404);
        await ensureCandidateCode(db.sequelize, candidate);

        const updates = {};
        for (const field of CANDIDATE_EDITABLE) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        if (Object.keys(updates).length) await candidate.update(updates);

        return sendSuccess(req, res, {
            ...candidate.toJSON(),
            referenceCode: candidate.reference_code,
            employeeCode: candidate.employee_code,
        });
    } catch (err) { return next(err); }
};

const getMyApplications = async (req, res, next) => {
    try {
        const ids = await candidateIdsForEmail(req.portal && req.portal.email);
        if (!ids.length) return sendSuccess(req, res, []);
        const rows = await db.Application.findAll({
            where: { candidate_id: { [Op.in]: ids } },
            include: [
                { model: db.JobListing, as: 'job', attributes: ['id', 'title', 'location', 'job_type'] },
                { model: db.Candidate, as: 'candidate', attributes: ['id', 'full_name', 'email'] },
            ],
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const getMyOffers = async (req, res, next) => {
    try {
        const ids = await candidateIdsForEmail(req.portal && req.portal.email);
        if (!ids.length) return sendSuccess(req, res, []);
        const rows = await db.Offer.findAll({
            where: { candidate_id: { [Op.in]: ids } },
            include: [{
                model: db.Application, as: 'application',
                include: [{ model: db.JobListing, as: 'job', attributes: ['id', 'title'] }],
            }],
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const getMyInterviews = async (req, res, next) => {
    try {
        const ids = await candidateIdsForEmail(req.portal && req.portal.email);
        if (!ids.length) return sendSuccess(req, res, []);
        const apps = await db.Application.findAll({ where: { candidate_id: { [Op.in]: ids } }, attributes: ['id'] });
        const appIds = apps.map((a) => a.id);
        if (!appIds.length) return sendSuccess(req, res, []);
        const rows = await db.Interview.findAll({
            where: { application_id: { [Op.in]: appIds } },
            include: [{
                model: db.Application, as: 'application',
                include: [
                    { model: db.Candidate, as: 'candidate', attributes: ['id', 'full_name', 'email'] },
                    { model: db.JobListing, as: 'job', attributes: ['id', 'title'] },
                ],
            }],
            order: [['scheduled_at', 'DESC']],
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const getMyDocuments = async (req, res, next) => {
    try {
        const ids = await candidateIdsForEmail(req.portal && req.portal.email);
        if (!ids.length) return sendSuccess(req, res, []);
        const rows = await db.Document.findAll({
            where: { candidate_id: { [Op.in]: ids }, status: { [Op.ne]: 'DELETED' } },
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const getMyApplicationDetail = async (req, res, next) => {
    try {
        const ids = await candidateIdsForEmail(req.portal && req.portal.email);
        if (!ids.length) throw new AppError('NOT_FOUND', 'Application not found', 404);
        const app = await db.Application.findOne({
            where: { id: req.params.id, candidate_id: { [Op.in]: ids } },
            include: [
                { model: db.JobListing, as: 'job' },
                { model: db.Candidate, as: 'candidate' },
                { model: db.Interview, as: 'interviews' },
            ],
        });
        if (!app) throw new AppError('NOT_FOUND', 'Application not found', 404);
        return sendSuccess(req, res, app);
    } catch (err) { return next(err); }
};

// Candidate accepts/rejects their OWN offer (email-scoped, not org-scoped).
const respondToMyOffer = async (req, res, next) => {
    try {
        const ids = await candidateIdsForEmail(req.portal && req.portal.email);
        if (!ids.length) throw new AppError('NOT_FOUND', 'Offer not found', 404);
        const offer = await db.Offer.findOne({
            where: { id: req.params.id, candidate_id: { [Op.in]: ids } },
            include: [{ model: db.Application, as: 'application' }],
        });
        if (!offer) throw new AppError('NOT_FOUND', 'Offer not found', 404);
        const response = String(req.body.response || '').toUpperCase();
        if (!['ACCEPTED', 'REJECTED'].includes(response)) {
            throw new AppError('VALIDATION_ERROR', 'response must be ACCEPTED or REJECTED', 422);
        }
        await offer.update({ status: response });
        if (offer.application) {
            await offer.application.update({
                status: response === 'ACCEPTED' ? 'hired' : 'rejected',
                hired_at: response === 'ACCEPTED' ? new Date() : null,
            });
            // Accepting from the dashboard is a hire like any other — same Employee ID path.
            await issueEmployeeCodeOnHire(offer.application);
        }
        return sendSuccess(req, res, offer);
    } catch (err) { return next(err); }
};

// ── Messages ─────────────────────────────────────────────────────────────────
// The candidate half of the per-application thread. Every read and write is scoped
// through candidateIdsForEmail, so a candidate can only ever reach their own thread.

async function ownedApplication(req, applicationId) {
    const ids = await candidateIdsForEmail(req.portal && req.portal.email);
    if (!ids.length) throw new AppError('NOT_FOUND', 'Application not found', 404);
    const app = await db.Application.findOne({
        where: { id: applicationId, candidate_id: { [Op.in]: ids } },
        include: [
            { model: db.Candidate, as: 'candidate', attributes: ['id', 'full_name', 'email', 'reference_code'] },
            { model: db.JobListing, as: 'job', attributes: ['id', 'title'] },
        ],
    });
    if (!app) throw new AppError('NOT_FOUND', 'Application not found', 404);
    return app;
}

const getMyMessages = async (req, res, next) => {
    try {
        const app = await ownedApplication(req, req.params.id);
        const rows = await db.ApplicationMessage.findAll({
            where: { application_id: app.id },
            order: [['created_at', 'ASC']],
        });
        // Opening the thread marks the recruiter's messages read — the candidate is here.
        await db.ApplicationMessage.update(
            { read_at: new Date() },
            { where: { application_id: app.id, sender_type: 'staff', read_at: null } },
        );
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const postMyMessage = async (req, res, next) => {
    try {
        const body = String(req.body.body || '').trim();
        if (!body) throw new AppError('VALIDATION_ERROR', 'body is required', 422);
        if (body.length > 5000) throw new AppError('VALIDATION_ERROR', 'Message is too long (max 5000 characters)', 422);

        const app = await ownedApplication(req, req.params.id);
        const cand = app.candidate;
        const message = await db.ApplicationMessage.create({
            application_id: app.id,
            org_id: app.org_id,
            sender_type: 'candidate',
            sender_name: (cand && cand.full_name) || req.portal.email,
            sender_email: req.portal.email,
            body,
        });

        // Tell the hiring team a candidate wrote in.
        const recipients = await db.SystemUser.findAll({
            where: { org_id: app.org_id, status: 'active' },
            attributes: ['email'],
            limit: 25,
        });
        const companyName = await companyNameFor(app.org_id);
        for (const staff of recipients) {
            sendMail('message.received', staff.email, {
                candidateName: (cand && cand.full_name) || req.portal.email,
                referenceCode: (cand && cand.reference_code) || '',
                jobTitle: app.job ? app.job.title : 'a role',
                companyName,
                body,
                applicationId: String(app.id),
            });
        }

        return sendSuccess(req, res, message, 201);
    } catch (err) { return next(err); }
};

module.exports = {
    getMyProfile, updateMyProfile, getMyApplications, getMyApplicationDetail,
    getMyOffers, getMyInterviews, getMyDocuments, respondToMyOffer,
    getMyMessages, postMyMessage,
};
