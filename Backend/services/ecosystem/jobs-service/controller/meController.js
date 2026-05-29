'use strict';
// Candidate self-service ("/me/*"). Scoped to the CALLER's identity (email), NOT an org —
// a candidate owns their application data wherever they applied. Staff also have a profile.
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

async function candidateIdsForEmail(email) {
    if (!email) return [];
    const rows = await db.Candidate.findAll({ where: { email }, attributes: ['id'] });
    return rows.map((r) => r.id);
}

const getMyProfile = async (req, res, next) => {
    try {
        const { role, email, candidateId, systemUserId, employerOrgId } = req.portal || {};
        let name = email;
        let candidate = null;
        if (candidateId) {
            candidate = await db.Candidate.findByPk(candidateId);
            if (candidate) name = candidate.full_name || name;
        } else if (systemUserId) {
            const s = await db.SystemUser.findByPk(systemUserId);
            if (s) name = s.name || name;
        }
        return sendSuccess(req, res, {
            role: role || 'CANDIDATE',
            email,
            name,
            userId: req.auth.userId,
            candidateId: candidateId || null,
            systemUserId: systemUserId || null,
            employerOrgId: employerOrgId || null,
            candidate: candidate ? candidate.toJSON() : null,
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
        }
        return sendSuccess(req, res, offer);
    } catch (err) { return next(err); }
};

module.exports = { getMyProfile, getMyApplications, getMyApplicationDetail, getMyOffers, getMyInterviews, getMyDocuments, respondToMyOffer };
