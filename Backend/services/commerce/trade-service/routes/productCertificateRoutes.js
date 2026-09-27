'use strict';
// Product & Certificate Verification — mounted at /v1/product_certificates
// (Phase 2, Step 8).
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const ctrl = require('../controller/productCertificateController');

router.get('/', authMiddleware, ctrl.listProductCertificates);
router.post('/', authMiddleware, ctrl.createProductCertificate);
router.patch('/:id/approve', authMiddleware, requireOrgType('compliance_agency'), ctrl.approveProductCertificate);
router.patch('/:id/reject', authMiddleware, requireOrgType('compliance_agency'), ctrl.rejectProductCertificate);

module.exports = router;
