'use strict';
const router = require('express').Router();
const ctrl = require('../controller/alertsController');

// Investor alerts feed (single-tenant). Reads + read-state toggles are unauthenticated and
// idempotent (the dashboard bell treats mark-read as best-effort).
router.get('/', ctrl.list);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
