'use strict';
const svc = require('../service/nightlifeService');
const v = require('../validators/nightlife');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const parse = (schema, body) => {
    const r = schema.safeParse(body || {});
    if (!r.success) {
        const issue = r.error.issues[0];
        throw new AppError('VALIDATION_ERROR', `${issue.path.join('.') || 'body'}: ${issue.message}`, 422);
    }
    return r.data;
};

// Wraps a handler so thrown/rejected errors reach the Express error middleware.
const h = (fn) => async (req, res, next) => {
    try { return await fn(req, res); } catch (err) { return next(err); }
};

const userId = (req) => (req.auth && req.auth.userId) || null;
const page = (req) => ({ limit: req.query.limit, offset: req.query.offset });

module.exports = {
    stats: h(async (req, res) => sendSuccess(req, res, await svc.publicStats())),
    listEvents: h(async (req, res) => sendSuccess(req, res, await svc.listEvents({
        city: req.query.city, from: req.query.from, to: req.query.to, clubId: req.query.clubId, ...page(req),
    }))),
    getEvent: h(async (req, res) => sendSuccess(req, res, await svc.getEvent(req.params.id))),
    adminListEvents: h(async (req, res) => sendSuccess(req, res, await svc.listEvents({
        city: req.query.city, from: req.query.from, to: req.query.to, clubId: req.query.clubId, includeAll: true, ...page(req),
    }))),
    adminCreateEvent: h(async (req, res) => sendSuccess(req, res, await svc.createEvent(parse(v.createEventSchema, req.body)), 201)),
    adminUpdateEvent: h(async (req, res) => sendSuccess(req, res, await svc.updateEvent(req.params.id, parse(v.updateEventSchema, req.body)))),

    listClubs: h(async (req, res) => sendSuccess(req, res, await svc.listClubs({
        state: req.query.state, city: req.query.city, q: req.query.q, ...page(req),
    }))),
    getClub: h(async (req, res) => sendSuccess(req, res, await svc.getClub(req.params.id))),
    createGuestList: h(async (req, res) => sendSuccess(req, res,
        await svc.createBooking(req.params.id, 'guest_list', parse(v.guestListSchema, req.body), userId(req)), 201)),
    createVipTable: h(async (req, res) => sendSuccess(req, res,
        await svc.createBooking(req.params.id, 'vip_table', parse(v.vipTableSchema, req.body), userId(req)), 201)),
    myBookings: h(async (req, res) => sendSuccess(req, res, await svc.listMyBookings(userId(req)))),

    adminListClubs: h(async (req, res) => sendSuccess(req, res, await svc.listClubs({
        state: req.query.state, city: req.query.city, q: req.query.q, includeArchived: true, ...page(req),
    }))),
    adminCreateClub: h(async (req, res) => sendSuccess(req, res, await svc.createClub(parse(v.createClubSchema, req.body)), 201)),
    adminUpdateClub: h(async (req, res) => sendSuccess(req, res, await svc.updateClub(req.params.id, parse(v.updateClubSchema, req.body)))),
    adminListBookings: h(async (req, res) => sendSuccess(req, res, await svc.listBookings({
        status: req.query.status, clubId: req.query.clubId, ...page(req),
    }))),
    adminSetBookingStatus: h(async (req, res) => sendSuccess(req, res,
        await svc.setBookingStatus(req.params.id, parse(v.bookingStatusSchema, req.body).status))),

    listListings: h(async (req, res) => sendSuccess(req, res, await svc.listListings({
        type: req.query.type, city: req.query.city, q: req.query.q, ...page(req),
    }))),
    getListing: h(async (req, res) => sendSuccess(req, res, await svc.getListing(req.params.slug))),
    applyToListing: h(async (req, res) => sendSuccess(req, res,
        await svc.applyToListing(req.params.slug, userId(req), parse(v.applyListingSchema, req.body)), 201)),
    myApplications: h(async (req, res) => sendSuccess(req, res, await svc.listMyApplications(userId(req)))),

    adminListListings: h(async (req, res) => sendSuccess(req, res, await svc.listListings({
        type: req.query.type, city: req.query.city, q: req.query.q, includeInactive: true, ...page(req),
    }))),
    adminCreateListing: h(async (req, res) => sendSuccess(req, res, await svc.createListing(parse(v.createListingSchema, req.body)), 201)),
    adminUpdateListing: h(async (req, res) => sendSuccess(req, res, await svc.updateListing(req.params.id, parse(v.updateListingSchema, req.body)))),
    adminListApplications: h(async (req, res) => sendSuccess(req, res, await svc.listApplications({
        status: req.query.status, listingId: req.query.listingId, ...page(req),
    }))),
    adminSetApplicationStatus: h(async (req, res) => sendSuccess(req, res,
        await svc.setApplicationStatus(req.params.id, parse(v.applicationStatusSchema, req.body).status))),
};
