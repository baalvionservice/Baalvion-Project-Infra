const express = require('express');
const router = express.Router();
const { requireRole } = require('@baalvion/auth-node');

const paymentsController = require('../controllers/paymentsController');

// War Room 3: fund-movement endpoints require a money role (admin/owner/super_admin,
// hierarchical). authMiddleware + tenantContext are already applied at the /v1 mount
// (index.js), so req.auth.roles is populated from the verified RS256 token. Reads
// (get/list/fee-breakdown) stay open to any authenticated tenant member.
const moneyMover = requireRole('admin', 'owner', 'super_admin');

/**
 * POST /v1/payments/initiate
 * Initiate a new payment (starts saga)
 */
router.post('/payments/initiate', moneyMover, paymentsController.initiatePayment);

/**
 * GET /v1/payments/:id
 * Get payment details and status
 */
router.get('/payments/:id', paymentsController.getPayment);

/**
 * GET /v1/payments
 * Query payments with filters
 */
router.get('/payments', paymentsController.listPayments);

/**
 * POST /v1/payments/:id/reverse
 * Reverse a payment (refund)
 */
router.post('/payments/:id/reverse', moneyMover, paymentsController.reversePayment);

/**
 * POST /v1/payments/bulk
 * Bulk disbursement (payroll, batch transfers)
 */
router.post('/payments/bulk', moneyMover, paymentsController.bulkPayments);

/**
 * GET /v1/payments/:id/fee-breakdown
 * Get fee calculation for informational purposes
 */
router.get('/payments/:id/fee-breakdown', paymentsController.getFeeBreakdown);

module.exports = router;
