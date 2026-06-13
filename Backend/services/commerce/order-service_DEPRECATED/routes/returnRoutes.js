'use strict';
const { Router } = require('express');
const ctrl = require('../controller/returnController');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { createReturnSchema, updateReturnStatusSchema } = require('../validators/orderSchemas');

const router = Router({ mergeParams: true });

// The router is mounted under optionalAuth (guest-capable returns), so admin + "my returns" routes
// RE-APPLY authMiddleware to require a valid token (a guest hitting them is 401'd before RBAC runs).
// Admin: listing all returns (cross-tenant) and processing them (approve/refund) require a role.
router.get('/', authMiddleware, loadStoreRole, requireStoreRole('store_viewer'), ctrl.listReturns);
// Customer-facing "my returns". MUST precede '/:returnId' so 'mine' is not parsed as a return id.
// authMiddleware is re-applied (router is optionalAuth) so a guest is 401'd — there is no "my returns" for a guest.
router.get('/mine', authMiddleware, ctrl.listMyReturns);
router.patch('/:returnId/status', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(updateReturnStatusSchema), ctrl.updateReturnStatus);
// Shopper: requesting a return is customer-initiated (guest-capable; NOT store-role gated).
// Authenticated → bound to the user; guest → bound to the signed X-Cart-Session (ownership enforced
// in returnService via ownerSessionId, same mechanism as guest orders).
router.post('/', validate(createReturnSchema), ctrl.createReturn);

module.exports = router;
