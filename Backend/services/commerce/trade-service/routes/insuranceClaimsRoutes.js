'use strict';
// Insurance claims — file → evidence_required → under_review → approved → paid (or rejected).
// These routes previously had NO authMiddleware and only "relied on tenantContext" — but
// tenantContext is NOT authentication. With v1Routes mounted without a global auth gate, an
// unauthenticated caller could approve and PAY claims (payClaim initiates a real payout).
// Reads/file/evidence require authentication (controller tenant-scopes); adjudication, payout
// and recovery require an org admin (matches insuranceController.isAdmin).
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const c = require('../controller/insuranceController');

const claimsAdmin = requireRole('admin', 'owner', 'super_admin');

// Static paths before '/:id'.
router.post('/from_incident', authMiddleware, c.fileClaimFromIncident);
router.get('/for_incident/:incidentId', authMiddleware, c.claimsForIncident);

router.get('/', authMiddleware, c.listClaims);
router.post('/', authMiddleware, c.fileClaim);
router.get('/:id', authMiddleware, c.getClaim);

// Evidence file — the claimant supplies it, the adjuster verifies or rejects it.
router.get('/:id/documents', authMiddleware, c.listClaimDocuments);
router.post('/:id/documents', authMiddleware, c.attachClaimDocument);
router.patch('/:id/documents/:docId', authMiddleware, claimsAdmin, c.reviewClaimDocument);
router.delete('/:id/documents/:docId', authMiddleware, c.removeClaimDocument);

router.post('/:id/withdraw', authMiddleware, c.withdrawClaim);
router.post('/:id/request_evidence', authMiddleware, claimsAdmin, c.requestEvidence);
router.post('/:id/assess', authMiddleware, claimsAdmin, c.assessClaim);
router.post('/:id/approve', authMiddleware, claimsAdmin, c.approveClaim);
router.post('/:id/reject', authMiddleware, claimsAdmin, c.rejectClaim);
router.post('/:id/pay', authMiddleware, claimsAdmin, c.payClaim);
router.post('/:id/subrogation', authMiddleware, claimsAdmin, c.recordSubrogation);
// What the carrier settled on their own paper (migration 071) — separate from the
// payout to the assured and from subrogation against whoever caused the loss.
router.post('/:id/underwriter_settlement', authMiddleware, claimsAdmin, c.recordUnderwriterSettlement);

module.exports = router;
