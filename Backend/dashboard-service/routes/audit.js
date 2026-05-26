'use strict';
const { Router } = require('express');
const ctrl = require('../controller/auditController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/logs', authMiddleware, ctrl.listAuditLogs);
router.post('/logs', authMiddleware, ctrl.createAuditLog);

module.exports = router;
