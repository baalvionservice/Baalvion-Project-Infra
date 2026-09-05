'use strict';
// Customs Gateway Abstraction Layer routes (War Room 4, Prompt 9).
// Mounted at /v1/customs_submissions (distinct from the legacy typed
// /v1/customs_entries). Every route requires a gateway identity; tenant scoping is
// enforced in the controller (ownership) + RLS at the DB.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/customsGatewayController');

// Static / non-:id routes FIRST so they are not shadowed by '/:id'.
router.get('/channels', ctrl.getChannels);            // public connector descriptor
// Integration status. /readiness says which gateways can file today and what is
// missing on the rest; /requirements/:channel is the enrolment checklist for one.
// Neither returns a secret — only whether each setting is present and usable.
router.get('/readiness', authMiddleware, ctrl.getReadiness);
router.get('/requirements/:channel', ctrl.getRequirements);
// These gateways decide asynchronously; polling is what turns a lodged filing
// into a known outcome.
router.post('/poll', authMiddleware, ctrl.pollPending);
router.post('/recover', authMiddleware, ctrl.recoverStalled); // admin recovery sweep

router.post('/', authMiddleware, ctrl.createSubmission);
router.get('/',  authMiddleware, ctrl.listSubmissions);

router.get('/:id',            authMiddleware, ctrl.getSubmission);
router.get('/:id/events',     authMiddleware, ctrl.getEvents);
router.post('/:id/retry',     authMiddleware, ctrl.retrySubmission);
router.post('/:id/cancel',    authMiddleware, ctrl.cancelSubmission);
router.post('/:id/poll',      authMiddleware, ctrl.pollSubmission);

module.exports = router;
