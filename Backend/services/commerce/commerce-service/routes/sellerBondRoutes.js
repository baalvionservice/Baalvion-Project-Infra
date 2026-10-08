'use strict';
const { Router } = require('express');
const ctrl = require('../controller/sellerBondController');
const { validate } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');
const { createBondSchema, submitPaymentSchema, confirmSchema, noteSchema } = require('../validators/sellerBondSchemas');

const router = Router();

// Seller side
router.get('/mine', ctrl.mine);
router.post('/', validate(createBondSchema), ctrl.create);
router.post('/:id/payment', validate(submitPaymentSchema), ctrl.submitPayment);

// Platform admin side
router.get('/', requirePlatformAdmin, ctrl.list);
router.post('/:id/confirm', requirePlatformAdmin, validate(confirmSchema), ctrl.confirm);
router.post('/:id/reject', requirePlatformAdmin, validate(noteSchema), ctrl.reject);
router.post('/:id/forfeit', requirePlatformAdmin, validate(noteSchema), ctrl.forfeit);

module.exports = router;
