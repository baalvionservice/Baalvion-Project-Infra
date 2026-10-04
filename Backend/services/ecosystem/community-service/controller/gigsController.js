'use strict';
const svc = require('../service/gigsService');
const v = require('../validators/gigs');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { resolveTier, can } = require('../middleware/staffAccess');

const parse = (schema, body) => {
    const r = schema.safeParse(body || {});
    if (!r.success) {
        const issue = r.error.issues[0];
        throw new AppError('VALIDATION_ERROR', `${issue.path.join('.') || 'body'}: ${issue.message}`, 422);
    }
    return r.data;
};
const h = (fn) => async (req, res, next) => {
    try { return await fn(req, res); } catch (err) { return next(err); }
};
const uid = (req) => req.auth.userId;
const page = (req) => ({ limit: req.query.limit, offset: req.query.offset });

module.exports = {
    getMyProfile: h(async (req, res) => sendSuccess(req, res, await svc.getMyProfile(uid(req)))),
    saveMyProfile: h(async (req, res) => sendSuccess(req, res, await svc.upsertMyProfile(uid(req), parse(v.profileSchema, req.body)))),
    listCandidates: h(async (req, res) => sendSuccess(req, res, await svc.listCandidates(uid(req), {
        zone: req.query.zone, q: req.query.q, isAdmin: can(await resolveTier(req), 'verify.review'), ...page(req),
    }))),
    revealContact: h(async (req, res) => sendSuccess(req, res, await svc.revealContact(uid(req), req.params.id))),

    getMyEmployer: h(async (req, res) => sendSuccess(req, res, await svc.getMyEmployer(uid(req)))),
    saveMyEmployer: h(async (req, res) => sendSuccess(req, res, await svc.upsertMyEmployer(uid(req), parse(v.employerSchema, req.body)))),

    listGigs: h(async (req, res) => sendSuccess(req, res, await svc.listGigs({ q: req.query.q, ...page(req) }))),
    getGig: h(async (req, res) => sendSuccess(req, res, await svc.getGig(req.params.id))),
    createGig: h(async (req, res) => sendSuccess(req, res, await svc.createGig(uid(req), parse(v.gigSchema, req.body)), 201)),
    myGigs: h(async (req, res) => sendSuccess(req, res, await svc.listMyGigs(uid(req)))),
    setMyGigStatus: h(async (req, res) => sendSuccess(req, res, await svc.setMyGigStatus(uid(req), req.params.id, parse(v.gigStatusSchema, req.body).status))),
    applyToGig: h(async (req, res) => sendSuccess(req, res, await svc.applyToGig(uid(req), req.params.id, parse(v.applySchema, req.body)), 201)),
    myApplications: h(async (req, res) => sendSuccess(req, res, await svc.listMyApplications(uid(req)))),
    withdrawApplication: h(async (req, res) => sendSuccess(req, res, await svc.withdrawApplication(uid(req), req.params.id))),
    gigApplications: h(async (req, res) => sendSuccess(req, res, await svc.listGigApplications(uid(req), req.params.id))),
    setGigApplicationStatus: h(async (req, res) => sendSuccess(req, res,
        await svc.setGigApplicationStatus(uid(req), req.params.id, parse(v.gigApplicationStatusSchema, req.body).status))),

    adminProfiles: h(async (req, res) => sendSuccess(req, res, await svc.adminListProfiles({ status: req.query.status, ...page(req) }))),
    adminReviewProfile: h(async (req, res) => sendSuccess(req, res, await svc.reviewProfile(req.params.id, uid(req), parse(v.reviewSchema, req.body)))),
    adminEmployers: h(async (req, res) => sendSuccess(req, res, await svc.adminListEmployers({ status: req.query.status, ...page(req) }))),
    adminReviewEmployer: h(async (req, res) => sendSuccess(req, res, await svc.reviewEmployer(req.params.id, uid(req), parse(v.reviewSchema, req.body)))),
    adminGigs: h(async (req, res) => sendSuccess(req, res, await svc.adminListGigs({ status: req.query.status, ...page(req) }))),
    adminSetGigStatus: h(async (req, res) => sendSuccess(req, res, await svc.adminSetGigStatus(req.params.id, parse(v.adminGigStatusSchema, req.body).status))),
};
