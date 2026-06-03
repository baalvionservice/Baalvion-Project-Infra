'use strict';
// admin-service :: support (ticketing) console routes.
//
// Mounted at /v1/support (sibling of /v1/admin) so the admin-platform's adminApiClient
// — whose base URL is .../platform/admin/v1 — resolves supportApi paths like
// '/support/stats' to '/v1/support/stats'.
//
// Auth: the global authMiddleware in routes/v1.js has already populated req.auth before
// this router runs. We re-apply the SAME super-admin gate used by adminRoutes.js so every
// support endpoint requires super_admin (mirrors `router.use(requireSuperAdmin)`).
const router = require('express').Router();
const ctrl   = require('../controller/supportController');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

router.use(requireSuperAdmin);

// Stats
router.get('/stats', ctrl.getStats);

// Macros (declared before /tickets/:id-style routes — distinct top-level segment)
router.get('/macros',        ctrl.listMacros);
router.post('/macros',       ctrl.createMacro);
router.patch('/macros/:id',  ctrl.updateMacro);
router.delete('/macros/:id', ctrl.deleteMacro);

// Customer timeline
router.get('/customers/:userId/timeline', ctrl.getCustomerTimeline);

// Tickets — messages + action sub-routes declared before the bare /tickets/:id
// where ordering matters (Express matches the more specific paths first regardless,
// but kept grouped for clarity).
router.get('/tickets',                  ctrl.listTickets);
router.get('/tickets/:id',              ctrl.getTicket);
router.patch('/tickets/:id',            ctrl.updateTicket);
router.post('/tickets/:id/assign',      ctrl.assignTicket);
router.post('/tickets/:id/escalate',    ctrl.escalateTicket);
router.post('/tickets/:id/close',       ctrl.closeTicket);
router.get('/tickets/:id/messages',     ctrl.listMessages);
router.post('/tickets/:id/messages',    ctrl.sendMessage);

module.exports = router;
