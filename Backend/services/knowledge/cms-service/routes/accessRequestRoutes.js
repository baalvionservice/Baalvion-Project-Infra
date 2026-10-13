'use strict';
const { Router } = require('express');
const ctrl = require('../controller/accessRequestController');
const { validate } = require('../middleware/validate');
const { createAccessRequestSchema, approveAccessRequestSchema, denyAccessRequestSchema } = require('../validators/accessRequestSchemas');

const router = Router();

// /cms/access-requests — any signed-in user may ask; only platform admins review.
router.get('/websites', ctrl.requestable);
router.get('/mine', ctrl.mine);
router.post('/', validate(createAccessRequestSchema), ctrl.create);
router.get('/', ctrl.list);
router.post('/:id/approve', validate(approveAccessRequestSchema), ctrl.approve);
router.post('/:id/deny', validate(denyAccessRequestSchema), ctrl.deny);

module.exports = router;
