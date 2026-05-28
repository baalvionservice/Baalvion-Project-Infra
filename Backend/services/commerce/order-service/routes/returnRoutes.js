'use strict';
const { Router } = require('express');
const ctrl = require('../controller/returnController');
const { validate } = require('../middleware/validate');
const { createReturnSchema, updateReturnStatusSchema } = require('../validators/orderSchemas');

const router = Router({ mergeParams: true });

router.get('/', ctrl.listReturns);
router.post('/', validate(createReturnSchema), ctrl.createReturn);
router.patch('/:returnId/status', validate(updateReturnStatusSchema), ctrl.updateReturnStatus);

module.exports = router;
