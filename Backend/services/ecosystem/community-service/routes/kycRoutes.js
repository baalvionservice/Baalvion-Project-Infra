'use strict';
const { Router } = require('express');
const ctrl = require('../controller/kycController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePerm } = require('../middleware/staffAccess');
const { requireInternalSecret } = require('../middleware/internalAuth');
const { internalOnly } = require('../middleware/internalOnly');
const { AppError } = require('../utils/errors');
const { rememberContact } = require('../middleware/rememberContact');
const userRateLimit = require('../middleware/userRateLimit');

const router = Router();
const baseAuth = authMiddleware;
const authMw = [baseAuth, rememberContact];
const admin = [authMw, requirePerm('kyc.review')];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (req, res, next, id) => (UUID.test(id) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404))));

router.get('/kyc/me', authMw, ctrl.mine);
// Each submission carries two images and is encrypted server-side; five tries an hour is plenty.
const submitLimit = userRateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many verification attempts, try again later' });
router.post('/kyc', authMw, submitLimit, ctrl.submit);

router.get('/admin/kyc', ...admin, ctrl.adminList);
router.get('/admin/kyc/:id/documents/:kind', ...admin, ctrl.adminDocument);
router.patch('/admin/kyc/:id', ...admin, ctrl.adminDecide);

// Order gate lookup (order-service -> here), authenticated with the shared internal secret.
router.get('/internal/kyc/:userId', internalOnly, requireInternalSecret, ctrl.internalStatus);

module.exports = router;
