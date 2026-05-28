'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/sessionController');
const { requireAdmin } = require('../middleware/authMiddleware');

// ── User-facing ───────────────────────────────────────────────────────────────
router.get('/',                         ctrl.listMySessions);
router.get('/stats',                    ctrl.getMySessionStats);
router.get('/:sessionId',               ctrl.getMySessionDetail);
router.delete('/',                      ctrl.revokeAllOtherSessions);
router.delete('/:sessionId',            ctrl.revokeMySession);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/all',                requireAdmin, ctrl.adminListAllSessions);
router.get('/admin/users/:userId',      requireAdmin, ctrl.adminGetUserSessions);
router.get('/admin/:sessionId',         requireAdmin, ctrl.adminGetSessionDetail);
router.delete('/admin/:sessionId',      requireAdmin, ctrl.adminRevokeSession);

module.exports = router;
