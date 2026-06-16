'use strict';
const { Router } = require('express');
const ctrl = require('../controller/gdprController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.post('/requests', authMiddleware, ctrl.createRequest);
router.patch('/requests/:requestKey', authMiddleware, ctrl.updateRequest);

module.exports = router;
