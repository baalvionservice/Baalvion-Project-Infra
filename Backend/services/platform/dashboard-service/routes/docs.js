'use strict';
const { Router } = require('express');
const ctrl = require('../controller/docsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);

module.exports = router;
