const express = require('express');
const router = express.Router();
const ctrl = require('../controller/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// ─── Core ─────────────────────────────────────────────────────────────────────
router.post('/order', authMiddleware, ctrl.createOrder);
router.post('/verify', authMiddleware, ctrl.verifyPayment);
router.get('/transactions', authMiddleware, ctrl.getTransactions);
router.get('/plans', authMiddleware, ctrl.getPlans);
router.get('/payment-methods', authMiddleware, ctrl.getPaymentMethods);

// ─── Orchestrator ─────────────────────────────────────────────────────────────
router.post('/orchestrate', ctrl.orchestrate);
router.post('/orchestrator-verify', ctrl.verify);
router.get('/provider-health', ctrl.getProviderHealth);

// ─── Razorpay: Subscriptions ──────────────────────────────────────────────────
router.post('/razorpay/subscription', authMiddleware, ctrl.createRazorpaySubscription);
router.get('/razorpay/subscription/:id', authMiddleware, ctrl.fetchRazorpaySubscription);
router.delete('/razorpay/subscription/:id', authMiddleware, ctrl.cancelRazorpaySubscription);

// ─── Razorpay: Payments & Refunds ─────────────────────────────────────────────
router.get('/razorpay/payment/:id', authMiddleware, ctrl.fetchRazorpayPayment);
router.post('/razorpay/refund', authMiddleware, ctrl.createRazorpayRefund);

// ─── Razorpay: Webhook (no auth — raw body needed) ────────────────────────────
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), (req, res, next) => {
    // Parse raw body back to object for event processing, but keep raw string for signature check
    if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body.toString();
        try { req.body = JSON.parse(req.rawBody); } catch (_) {}
    }
    next();
}, ctrl.razorpayWebhook);

// ─── PayU: Subscriptions ──────────────────────────────────────────────────────
router.post('/payu/subscription', authMiddleware, ctrl.createPayuSubscription);
router.delete('/payu/subscription/:token', authMiddleware, ctrl.cancelPayuSubscription);

// ─── PayU: Refunds & Transactions ─────────────────────────────────────────────
router.post('/payu/refund', authMiddleware, ctrl.createPayuRefund);
router.get('/payu/transaction/:txnId', authMiddleware, ctrl.getPayuTransaction);

// ─── PayU: Webhook (no auth — form POST from PayU) ───────────────────────────
router.post('/webhook/payu', ctrl.payuWebhook);

// ─── RazorpayX ────────────────────────────────────────────────────────────────
router.post('/validate-fund-account', authMiddleware, ctrl.validateFundAccount);
router.post('/payout', authMiddleware, ctrl.createPayout);

// ─── Legacy webhook route ─────────────────────────────────────────────────────
router.post('/webhook/:provider', ctrl.webhook);
router.post('/reconcile', authMiddleware, ctrl.reconcile);

module.exports = router;
