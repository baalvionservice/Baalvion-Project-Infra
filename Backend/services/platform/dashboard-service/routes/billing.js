'use strict';
const { Router } = require('express');
const ctrl = require('../controller/billingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.patch('/', authMiddleware, ctrl.update);

module.exports = router;
