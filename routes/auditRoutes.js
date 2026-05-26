'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { listAudit, verify } = require('../controller/auditController');

router.get('/',       authMiddleware, listAudit);
router.get('/verify', authMiddleware, verify);

module.exports = router;
