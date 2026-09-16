'use strict';
// Freight Marketplace Integration Layer routes (War Room 4, Prompt 10).
// Mounted at /v1/freight (distinct from the legacy /carriers + /shipping_quotes
// store-shadow endpoints). Carrier discovery is public; quoting + booking require a
// gateway identity; tenant scoping is enforced in the controller (ownership) + RLS.
const router = require('express').Router();
const { authMiddleware, requireVerified } = require('../middleware/authMiddleware');
const config = require('../config/appConfig');
const ctrl = require('../controller/freightMarketplaceController');

// Static / non-:id routes FIRST so they are not shadowed by '/:id'.
router.get('/carriers', ctrl.getCarriers);                 // public marketplace descriptor
router.post('/quotes', authMiddleware, ctrl.compareQuotes); // quote comparison engine
router.post('/recover', authMiddleware, ctrl.recoverStalled); // admin recovery sweep

// Committing a booking puts the platform on the hook to a carrier under the
// caller's name, so it demands a verified organization behind that name. Quoting
// (above) stays open — nothing is committed by asking a price.
router.post('/', authMiddleware, requireVerified(config.verification.requiredLevel), ctrl.createBooking);
router.get('/',  authMiddleware, ctrl.listBookings);

router.get('/:id',          authMiddleware, ctrl.getBooking);
router.get('/:id/events',   authMiddleware, ctrl.getEvents);
router.post('/:id/status',  authMiddleware, ctrl.updateStatus);
router.post('/:id/retry',   authMiddleware, ctrl.retryBooking);
router.post('/:id/cancel',  authMiddleware, ctrl.cancelBooking);

module.exports = router;
