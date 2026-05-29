const express = require('express');
const router = express.Router();

const paymentsController = require('../controllers/paymentsController');

/**
 * POST /v1/payments/initiate
 * Initiate a new payment (starts saga)
 */
router.post('/payments/initiate', paymentsController.initiatePayment);

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
router.post('/payments/:id/reverse', paymentsController.reversePayment);

/**
 * POST /v1/payments/bulk
 * Bulk disbursement (payroll, batch transfers)
 */
router.post('/payments/bulk', paymentsController.bulkPayments);

/**
 * GET /v1/payments/:id/fee-breakdown
 * Get fee calculation for informational purposes
 */
router.get('/payments/:id/fee-breakdown', paymentsController.getFeeBreakdown);

module.exports = router;
