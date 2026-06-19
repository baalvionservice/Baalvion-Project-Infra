'use strict';
const { Router } = require('express');
const ctrl = require('../controller/appointmentController');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { bookAppointmentSchema, updateAppointmentStatusSchema } = require('../validators/appointmentSchemas');

// Mounted under optionalAuth (guest-capable booking). The "mine" + admin routes RE-APPLY
// authMiddleware so a guest is 401'd before RBAC runs.
const router = Router({ mergeParams: true });

// Customer-facing "my appointments". MUST precede '/:id' so 'mine' is not parsed as an id.
router.get('/mine', authMiddleware, ctrl.listMine);
// Admin: list all appointments (cross-customer). Store role required.
router.get('/', authMiddleware, loadStoreRole, requireStoreRole('store_viewer'), ctrl.list);
// Shopper/guest: book (NOT store-role gated; ownership bound in-service to userId or guest session).
router.post('/', validate(bookAppointmentSchema), ctrl.book);
// Admin/ops: advance status along the forward-only machine.
router.patch('/:id/status', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(updateAppointmentStatusSchema), ctrl.updateStatus);

module.exports = router;
