'use strict';
const { Router } = require('express');
const ctrl = require('../controller/gigsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');
const { rememberContact } = require('../middleware/rememberContact');
const { requirePerm } = require('../middleware/staffAccess');

const router = Router();
const baseAuth = authMiddleware;
const authMw = [baseAuth, rememberContact];

// Non-UUID ids would reach Postgres as a cast error (a 500); answer 404 instead.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (req, res, next, id) => (UUID.test(id) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404))));
const adminAuth = [authMw];

// Gigs board is public; everything that touches people or money-adjacent data needs a session.
router.get('/nightlife/gigs', ctrl.listGigs);
router.get('/nightlife/gigs/mine', authMw, ctrl.myGigs);
router.get('/nightlife/gigs/:id', ctrl.getGig);

router.get('/nightlife/profile/me', authMw, ctrl.getMyProfile);
router.put('/nightlife/profile/me', authMw, ctrl.saveMyProfile);
router.get('/nightlife/employer/me', authMw, ctrl.getMyEmployer);
router.put('/nightlife/employer/me', authMw, ctrl.saveMyEmployer);

router.get('/nightlife/candidates', authMw, ctrl.listCandidates);
router.post('/nightlife/candidates/:id/contact', authMw, ctrl.revealContact);

router.post('/nightlife/gigs', authMw, ctrl.createGig);
router.patch('/nightlife/gigs/:id', authMw, ctrl.setMyGigStatus);
router.post('/nightlife/gigs/:id/apply', authMw, ctrl.applyToGig);
router.get('/nightlife/gigs/:id/applications', authMw, ctrl.gigApplications);
router.patch('/nightlife/gig-applications/:id', authMw, ctrl.setGigApplicationStatus);
router.get('/nightlife/gig-applications/mine', authMw, ctrl.myApplications);
router.post('/nightlife/gig-applications/:id/withdraw', authMw, ctrl.withdrawApplication);

router.get('/admin/nightlife/profiles', ...adminAuth, requirePerm('verify.review'), ctrl.adminProfiles);
router.patch('/admin/nightlife/profiles/:id', ...adminAuth, requirePerm('verify.review'), ctrl.adminReviewProfile);
router.get('/admin/nightlife/employers', ...adminAuth, requirePerm('verify.review'), ctrl.adminEmployers);
router.patch('/admin/nightlife/employers/:id', ...adminAuth, requirePerm('verify.review'), ctrl.adminReviewEmployer);
router.get('/admin/nightlife/gigs', ...adminAuth, requirePerm('content.manage'), ctrl.adminGigs);
router.patch('/admin/nightlife/gigs/:id', ...adminAuth, requirePerm('content.manage'), ctrl.adminSetGigStatus);

module.exports = router;
