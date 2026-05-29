'use strict';
const { Router } = require('express');
const ctrl = require('../controller/meController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// Per-route auth (NOT router.use) — this router is mounted at '/', so a catch-all
// middleware here would intercept every request including public ones.
router.get('/me/profile', authMiddleware, ctrl.getMyProfile);
router.get('/me/applications', authMiddleware, ctrl.getMyApplications);
router.get('/me/applications/:id', authMiddleware, ctrl.getMyApplicationDetail);
router.get('/me/offers', authMiddleware, ctrl.getMyOffers);
router.patch('/me/offers/:id/response', authMiddleware, ctrl.respondToMyOffer);
router.get('/me/interviews', authMiddleware, ctrl.getMyInterviews);
router.get('/me/documents', authMiddleware, ctrl.getMyDocuments);

module.exports = router;
