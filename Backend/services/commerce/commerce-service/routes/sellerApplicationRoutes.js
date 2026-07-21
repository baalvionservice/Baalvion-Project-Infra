'use strict';
const { Router } = require('express');
const ctrl = require('../controller/sellerApplicationController');
const { validate } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');
const { createApplicationSchema, rejectApplicationSchema } = require('../validators/sellerApplicationSchemas');

const router = Router();

// Any authenticated user may apply to become a seller.
router.post('/', validate(createApplicationSchema), ctrl.createApplication);
router.get('/mine', ctrl.listMyApplications);

// Review queue — platform admins only (super_admin or country_admin).
router.get('/', requirePlatformAdmin, ctrl.listApplications);
router.get('/:id', requirePlatformAdmin, ctrl.getApplication);
router.post('/:id/approve', requirePlatformAdmin, ctrl.approveApplication);
router.post('/:id/reject', requirePlatformAdmin, validate(rejectApplicationSchema), ctrl.rejectApplication);
router.post('/:id/verify-identity', requirePlatformAdmin, ctrl.verifyIdentity);

module.exports = router;
