'use strict';
const { Router } = require('express');
const ctrl = require('../controller/syncController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.post('/conflicts/:conflictKey/resolve', authMiddleware, ctrl.resolveConflict);

module.exports = router;
