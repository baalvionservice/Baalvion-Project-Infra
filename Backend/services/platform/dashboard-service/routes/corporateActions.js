'use strict';
const { Router } = require('express');
const ctrl = require('../controller/corporateActionsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.post('/', authMiddleware, ctrl.create);
router.patch('/:dealKey', authMiddleware, ctrl.update);

module.exports = router;
