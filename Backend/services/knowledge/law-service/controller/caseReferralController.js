'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const mailer = require('../service/mailer');

// Professional case-routing referrals — distinct from legal.referrals (the
// growth referral-code/rewards program). Flow: Create -> Select Country/
// Practice Area/City -> Choose Lawyer -> Send -> Accept/Decline -> Case
// Shared -> Completed.

const myLawyer = async (req) => db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });

const REFERRAL_INCLUDE = [
    { model: db.Lawyer, as: 'fromLawyer', attributes: ['id', 'name', 'email', 'profile_photo'] },
    { model: db.Lawyer, as: 'toLawyer', attributes: ['id', 'name', 'email', 'profile_photo'] },
    { model: db.PracticeArea, as: 'practiceArea', attributes: ['id', 'name', 'slug'] },
    { model: db.State, as: 'state', attributes: ['id', 'name'] },
    { model: db.City, as: 'city', attributes: ['id', 'name'] },
];

// Best-effort in-app + email notification; never blocks the request path.
async function notify(lawyer, action, { title, fromName }) {
    if (!lawyer) return;
    try {
        await db.Notification.create({
            user_id: lawyer.user_id,
            type: 'case_referral',
            title: action === 'sent' ? 'New case referral' : `Referral ${action}`,
            message: action === 'sent'
                ? `${fromName || 'A colleague'} sent you a case referral: ${title}`
                : `Your referral "${title}" was ${action}`,
            read: false,
        });
    } catch (_) { /* non-critical */ }
    if (lawyer.email) mailer.sendTemplate('caseReferral', lawyer.email, { name: lawyer.name, fromName, title, action }).catch(() => {});
}

const createReferral = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));

        const { toLawyerId, countryCode, stateId, cityId, practiceAreaId, title, description } = req.body || {};
        if (!toLawyerId || !title) return next(new AppError('VALIDATION_ERROR', 'toLawyerId and title are required', 422));
        if (Number(toLawyerId) === lawyer.id) return next(new AppError('VALIDATION_ERROR', 'Cannot refer a case to yourself', 422));

        const toLawyer = await db.Lawyer.findByPk(Number(toLawyerId));
        if (!toLawyer || toLawyer.status !== 'active') {
            return next(new AppError('VALIDATION_ERROR', 'Recipient must be an active, verified lawyer', 422));
        }

        const referral = await db.CaseReferral.create({
            from_lawyer_id: lawyer.id,
            to_lawyer_id: toLawyer.id,
            country_code: countryCode || null,
            state_id: stateId || null,
            city_id: cityId || null,
            practice_area_id: practiceAreaId || null,
            title,
            description: description || null,
            status: 'sent',
        });

        await notify(toLawyer, 'sent', { title, fromName: lawyer.name });

        const full = await db.CaseReferral.findByPk(referral.id, { include: REFERRAL_INCLUDE });
        return sendSuccess(req, res, full, 201);
    } catch (err) { return next(err); }
};

const listReferrals = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));

        const { box = 'incoming', status, page = 1, limit = 20 } = req.query;
        const where = box === 'outgoing' ? { from_lawyer_id: lawyer.id } : { to_lawyer_id: lawyer.id };
        if (status) where.status = status;

        const limitN = Math.min(Number(limit) || 20, 100);
        const offset = (Number(page) - 1) * limitN;
        const { count, rows } = await db.CaseReferral.findAndCountAll({
            where, include: REFERRAL_INCLUDE, order: [['created_at', 'DESC']], limit: limitN, offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: limitN, totalPages: Math.ceil(count / limitN) },
        });
    } catch (err) { return next(err); }
};

const getReferral = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer profile not found', 404));
        const referral = await db.CaseReferral.findByPk(req.params.id, { include: REFERRAL_INCLUDE });
        if (!referral) return next(new AppError('NOT_FOUND', 'Referral not found', 404));
        if (referral.from_lawyer_id !== lawyer.id && referral.to_lawyer_id !== lawyer.id) {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        return sendSuccess(req, res, referral);
    } catch (err) { return next(err); }
};

// Shared guard for every state-transition endpoint below.
const loadForTransition = async (req, requiredSide, allowedFrom) => {
    const lawyer = await myLawyer(req);
    if (!lawyer) return { error: new AppError('NOT_FOUND', 'Lawyer profile not found', 404) };
    const referral = await db.CaseReferral.findByPk(req.params.id, { include: REFERRAL_INCLUDE });
    if (!referral) return { error: new AppError('NOT_FOUND', 'Referral not found', 404) };
    const ownerId = requiredSide === 'to' ? referral.to_lawyer_id : referral.from_lawyer_id;
    if (ownerId !== lawyer.id) return { error: new AppError('FORBIDDEN', 'Not authorised for this action', 403) };
    if (!allowedFrom.includes(referral.status)) {
        return { error: new AppError('CONFLICT', `Referral must be ${allowedFrom.join(' or ')} (currently ${referral.status})`, 409) };
    }
    return { lawyer, referral };
};

const acceptReferral = async (req, res, next) => {
    try {
        const { lawyer, referral, error } = await loadForTransition(req, 'to', ['sent']);
        if (error) return next(error);
        await referral.update({ status: 'accepted' });
        await notify(referral.fromLawyer, 'accepted', { title: referral.title, fromName: lawyer.name });
        return sendSuccess(req, res, referral);
    } catch (err) { return next(err); }
};

const declineReferral = async (req, res, next) => {
    try {
        const { lawyer, referral, error } = await loadForTransition(req, 'to', ['sent']);
        if (error) return next(error);
        await referral.update({ status: 'declined' });
        await notify(referral.fromLawyer, 'declined', { title: referral.title, fromName: lawyer.name });
        return sendSuccess(req, res, referral);
    } catch (err) { return next(err); }
};

const cancelReferral = async (req, res, next) => {
    try {
        const { referral, error } = await loadForTransition(req, 'from', ['sent']);
        if (error) return next(error);
        await referral.update({ status: 'cancelled' });
        return sendSuccess(req, res, referral);
    } catch (err) { return next(err); }
};

// Attaches an existing case (owned by the sender) to an accepted referral.
const shareCase = async (req, res, next) => {
    try {
        const { lawyer, referral, error } = await loadForTransition(req, 'from', ['accepted']);
        if (error) return next(error);
        const { caseId } = req.body || {};
        if (!caseId) return next(new AppError('VALIDATION_ERROR', 'caseId is required', 422));
        const matter = await db.Case.findByPk(Number(caseId));
        if (!matter || matter.lawyer_id !== lawyer.id) {
            return next(new AppError('FORBIDDEN', 'caseId must be a matter you are assigned to', 403));
        }
        await referral.update({ status: 'case_shared', case_id: matter.id });
        await notify(referral.toLawyer, 'case_shared', { title: referral.title, fromName: lawyer.name });
        return sendSuccess(req, res, referral);
    } catch (err) { return next(err); }
};

const completeReferral = async (req, res, next) => {
    try {
        const { lawyer, referral, error } = await loadForTransition(req, 'from', ['case_shared']);
        if (error) return next(error);
        await referral.update({ status: 'completed' });
        await notify(referral.toLawyer, 'completed', { title: referral.title, fromName: lawyer.name });
        return sendSuccess(req, res, referral);
    } catch (err) { return next(err); }
};

// Dashboard "Referral Requests" widget — pending incoming count.
const pendingIncomingCount = async (req, res, next) => {
    try {
        const lawyer = await myLawyer(req);
        if (!lawyer) return sendSuccess(req, res, { count: 0 });
        const count = await db.CaseReferral.count({ where: { to_lawyer_id: lawyer.id, status: 'sent' } });
        return sendSuccess(req, res, { count });
    } catch (err) { return next(err); }
};

module.exports = {
    createReferral, listReferrals, getReferral,
    acceptReferral, declineReferral, cancelReferral,
    shareCase, completeReferral, pendingIncomingCount,
};
