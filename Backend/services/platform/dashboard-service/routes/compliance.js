'use strict';
const { Router } = require('express');
const ctrl = require('../controller/complianceController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listCompliance);
router.post('/', authMiddleware, ctrl.createCompliance);
router.get('/:country_id', authMiddleware, ctrl.getComplianceByCountry);
router.patch('/:id', authMiddleware, ctrl.updateCompliance);

module.exports = router;
