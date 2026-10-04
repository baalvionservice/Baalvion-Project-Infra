'use strict';
const { Router } = require('express');
const ctrl = require('../controller/nightlifeController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');
const { rememberContact } = require('../middleware/rememberContact');
const { requirePerm } = require('../middleware/staffAccess');
const { overview } = require('../service/adminOverviewService');
const { sendSuccess } = require('../utils/response');

const router = Router();
const baseAuth = authMiddleware;
const authMw = [baseAuth, rememberContact];

// :id on the admin routes is a UUID; clubs also accept a slug on the public GET, so only guard admin writes.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidParam = (req, res, next) => (UUID.test(req.params.id) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404)));
const adminAuth = [authMw];

router.get('/nightlife/stats', ctrl.stats);

// Clubs (public reads; bookings accept guests, attach the user when a token is present)
router.get('/nightlife/clubs', ctrl.listClubs);
router.get('/nightlife/clubs/:id', ctrl.getClub);
router.get('/nightlife/events', ctrl.listEvents);
router.get('/nightlife/events/:id', uuidParam, ctrl.getEvent);
router.post('/nightlife/clubs/:id/guest-list', optionalAuthMiddleware, ctrl.createGuestList);
router.post('/nightlife/clubs/:id/vip-tables', optionalAuthMiddleware, ctrl.createVipTable);
router.get('/nightlife/bookings/mine', authMw, ctrl.myBookings);

router.get('/admin/overview', ...adminAuth, requirePerm(), async (req, res, next) => {
    try { return sendSuccess(req, res, await overview()); } catch (err) { return next(err); }
});
router.get('/admin/nightlife/clubs', ...adminAuth, requirePerm('content.manage'), ctrl.adminListClubs);
router.post('/admin/nightlife/clubs', ...adminAuth, requirePerm('content.manage'), ctrl.adminCreateClub);
router.patch('/admin/nightlife/clubs/:id', ...adminAuth, requirePerm('content.manage'), uuidParam, ctrl.adminUpdateClub);
router.get('/admin/nightlife/events', ...adminAuth, requirePerm('content.manage'), ctrl.adminListEvents);
router.post('/admin/nightlife/events', ...adminAuth, requirePerm('content.manage'), ctrl.adminCreateEvent);
router.patch('/admin/nightlife/events/:id', ...adminAuth, requirePerm('content.manage'), uuidParam, ctrl.adminUpdateEvent);
router.get('/admin/nightlife/bookings', ...adminAuth, requirePerm('content.handle'), ctrl.adminListBookings);
router.patch('/admin/nightlife/bookings/:id', ...adminAuth, requirePerm('content.handle'), uuidParam, ctrl.adminSetBookingStatus);

// Locals hub
router.get('/nightlife/locals', ctrl.listListings);
router.get('/nightlife/locals/:slug', ctrl.getListing);
router.post('/nightlife/locals/:slug/applications', authMw, ctrl.applyToListing);
router.get('/nightlife/applications/mine', authMw, ctrl.myApplications);

router.get('/admin/nightlife/locals', ...adminAuth, requirePerm('content.manage'), ctrl.adminListListings);
router.post('/admin/nightlife/locals', ...adminAuth, requirePerm('content.manage'), ctrl.adminCreateListing);
router.patch('/admin/nightlife/locals/:id', ...adminAuth, requirePerm('content.manage'), uuidParam, ctrl.adminUpdateListing);
router.get('/admin/nightlife/applications', ...adminAuth, requirePerm('content.handle'), ctrl.adminListApplications);
router.patch('/admin/nightlife/applications/:id', ...adminAuth, requirePerm('content.handle'), uuidParam, ctrl.adminSetApplicationStatus);

module.exports = router;
