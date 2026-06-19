'use strict';
const { Router } = require('express');
const ctrl = require('../controller/consignmentController');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const {
    submitConsignmentSchema,
    updateConsignmentStatusSchema,
    recordAuthenticationSchema,
    issueCertificateSchema,
    upsertSellerProfileSchema,
} = require('../validators/consignmentSchemas');

// Mounted under optionalAuth (guest-capable submission + public certificate verify). Admin/ops and
// customer-facing "mine"/seller routes RE-APPLY authMiddleware so a guest is 401'd before RBAC runs.
const router = Router({ mergeParams: true });

// ── PUBLIC certificate verification. No auth — MUST precede any '/:id' so 'certificates' is literal.
router.get('/certificates/:code/verify', ctrl.verifyCertificate);

// ── Authenticated seller self-service profile. Literal '/sellers' precedes '/requests/:id'.
router.get('/sellers/me', authMiddleware, ctrl.getSellerProfile);
router.put('/sellers/me', authMiddleware, validate(upsertSellerProfileSchema), ctrl.upsertSellerProfile);

// ── Admin: list all requests (cross-customer). Store role required.
router.get('/requests', authMiddleware, loadStoreRole, requireStoreRole('store_viewer'), ctrl.listConsignments);
// ── Customer-facing "my consignments". MUST precede '/requests/:id' so 'mine' is not an id.
router.get('/requests/mine', authMiddleware, ctrl.listMyConsignments);
// ── Shopper/guest: submit. NOT store-role gated (customer-initiated, guest-capable).
router.post('/requests', validate(submitConsignmentSchema), ctrl.submitConsignment);
// ── Owner/guest/staff: read a single request (ownership enforced in-service).
router.get('/requests/:id', ctrl.getConsignment);
// ── Admin/ops: transition + authentication + certificate issuance.
router.patch('/requests/:id/status', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(updateConsignmentStatusSchema), ctrl.updateConsignmentStatus);
router.post('/requests/:id/items/:itemId/authentication', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(recordAuthenticationSchema), ctrl.recordAuthentication);
router.post('/requests/:id/items/:itemId/certificate', authMiddleware, loadStoreRole, requireStoreRole('ops_manager'), validate(issueCertificateSchema), ctrl.issueCertificate);

module.exports = router;
