'use strict';
const { Router } = require('express');
const ctrl = require('../controller/aiController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.get('/summary', authMiddleware, ctrl.summary);

module.exports = router;
