const paymentService = require('../service/paymentService');
const orchestrator = require('../service/paymentOrchestrator');
const razorpayService = require('../service/providers/razorpayService');
const payuService = require('../service/providers/payuService');
const razorpayXService = require('../service/razorpayXService');
const models = require('../models');

// ─── Existing: Orders / Verify / Transactions ─────────────────────────────────

const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { plan_id } = req.body;
        if (!plan_id) return res.status(400).json({ success: false, message: 'plan_id is required' });
        const result = await paymentService.createOrder(userId, plan_id);
        return res.status(201).json({ success: true, message: 'Order created successfully', data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan_id) {
            return res.status(400).json({ success: false, message: 'razorpay_order_id, razorpay_payment_id, razorpay_signature and plan_id are required' });
        }
        const result = await paymentService.verifyPayment(userId, razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id);
        return res.status(200).json({ success: true, message: 'Payment verified successfully', data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const orchestrate = async (req, res) => {
    let { plan_id, provider: preferredProvider } = req.body;
    if (!plan_id) plan_id = 1;
    try {
        const plans = await paymentService.getPlans();
        const plan = plans.find(item => String(item.id) === String(plan_id) || String(item.slug) === String(plan_id));
        if (!plan) return res.status(400).json({ error: 'Invalid plan_id' });
        const amount = Number(plan.price || plan.monthlyPrice || 0);
        const currency = 'INR';
        const receipt = `plan_${plan_id}_${Date.now()}`;
        const { provider, order } = await orchestrator.orchestratePayment({ amount, currency, receipt, provider: preferredProvider });
        res.json({ provider, order });
    } catch (err) {
        const message = err?.message || 'Payment orchestration failed';
        const status = /missing|invalid|not configured|unsupported|provider/i.test(message) ? 400 : 500;
        return res.status(status).json({ error: message });
    }
};

const orchestratorVerify = async (req, res) => {
    const { provider, ...paymentData } = req.body;
    try {
        const verified = await orchestrator.verifyPayment(provider, paymentData);
        if (verified) return res.json({ success: true });
        return res.status(400).json({ error: 'Verification failed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await paymentService.getUserTransactions(userId);
        return res.status(200).json({ success: true, message: 'Transactions fetched successfully', data });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getPlans = async (req, res) => {
    try {
        const plans = await paymentService.getPlans();
        return res.status(200).json({ success: true, data: plans });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getPaymentMethods = async (req, res) => {
    try {
        // Tenancy comes ONLY from the verified credential — never from headers.
        const orgId = req.auth?.organizationId || req.user?.orgId;
        if (!orgId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const data = await paymentService.getPaymentMethods(orgId);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getProviderHealth = async (req, res) => {
    try {
        const health = await orchestrator.getAllProviderHealth();
        res.json(health);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── Razorpay: Subscriptions ──────────────────────────────────────────────────

const createRazorpaySubscription = async (req, res) => {
    try {
        const { planId, totalCount, quantity, notes } = req.body;
        if (!planId) return res.status(400).json({ success: false, message: 'planId is required' });
        const subscription = await razorpayService.createSubscription({ planId, totalCount, quantity, notes });
        return res.status(201).json({ success: true, data: subscription });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

const fetchRazorpaySubscription = async (req, res) => {
    try {
        const data = await razorpayService.fetchSubscription(req.params.id);
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

const cancelRazorpaySubscription = async (req, res) => {
    try {
        const cancelAtCycleEnd = req.query.immediately !== 'true';
        const data = await razorpayService.cancelSubscription(req.params.id, cancelAtCycleEnd);
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ─── Razorpay: Refunds ────────────────────────────────────────────────────────

const createRazorpayRefund = async (req, res) => {
    try {
        const { paymentId, amount, notes } = req.body;
        if (!paymentId) return res.status(400).json({ success: false, message: 'paymentId is required' });
        const data = await razorpayService.createRefund(paymentId, amount, notes);
        return res.status(201).json({ success: true, data });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

const fetchRazorpayPayment = async (req, res) => {
    try {
        const data = await razorpayService.fetchPayment(req.params.id);
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ─── Razorpay: Webhooks ───────────────────────────────────────────────────────

const razorpayWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = JSON.stringify(req.body);
    const signatureVerified = razorpayService.verifyWebhookSignature(rawBody, signature);

    try {
        if (models.webhook_logs?.create) {
            await models.webhook_logs.create({ gateway: 'razorpay', payload_json: req.body, signature_verified: signatureVerified, processed: false }).catch(() => {});
        }
    } catch (_) {}

    if (!signatureVerified) return res.status(400).json({ success: false, message: 'Invalid webhook signature' });

    try {
        const event = req.body.event;
        const payload = req.body.payload || {};
        await razorpayService.handleWebhookEvent(event, payload);
        if (models.webhook_logs?.update) {
            await models.webhook_logs.update({ processed: true }, { where: { gateway: 'razorpay', payload_json: { event } } }).catch(() => {});
        }
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('[Webhook] Razorpay event processing failed:', err.message);
        return res.status(200).json({ success: true }); // Always 200 to Razorpay
    }
};

// ─── PayU: Refunds ────────────────────────────────────────────────────────────

const createPayuRefund = async (req, res) => {
    try {
        const { txnId, amount, reason } = req.body;
        if (!txnId || !amount) return res.status(400).json({ success: false, message: 'txnId and amount are required' });
        const data = await payuService.createRefund(txnId, amount, reason);
        return res.status(201).json({ success: true, data });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

const getPayuTransaction = async (req, res) => {
    try {
        const data = await payuService.getTransactionDetails(req.params.txnId);
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ─── PayU: Subscriptions ──────────────────────────────────────────────────────

const createPayuSubscription = async (req, res) => {
    try {
        const { amount, currency, customer, productinfo, frequency } = req.body;
        if (!amount || !customer?.email) return res.status(400).json({ success: false, message: 'amount and customer.email are required' });
        const data = await payuService.createSubscription({ amount, currency, customer, productinfo, frequency });
        return res.status(201).json({ success: true, data });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

const cancelPayuSubscription = async (req, res) => {
    try {
        const data = await payuService.cancelSubscription(req.params.token);
        return res.json({ success: true, data });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

// ─── PayU: Webhook ────────────────────────────────────────────────────────────

const payuWebhook = async (req, res) => {
    try {
        const result = await payuService.verifyWebhook(req.body);
        if (!result.valid) {
            console.warn('[Webhook] PayU verification failed:', result.reason);
            return res.status(400).json({ success: false, message: result.reason });
        }
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('[Webhook] PayU processing failed:', err.message);
        return res.status(200).json({ success: true }); // Always 200 to PayU
    }
};

// ─── RazorpayX ───────────────────────────────────────────────────────────────

const validateFundAccount = async (req, res) => {
    try {
        const { account_type, fund_account } = req.body;
        if (!account_type || !fund_account) return res.status(400).json({ success: false, message: 'account_type and fund_account are required' });
        const result = await razorpayXService.validateFundAccount(account_type, fund_account);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const createPayout = async (req, res) => {
    try {
        const payoutData = req.body;
        if (!payoutData.account_number || !payoutData.fund_account_id || !payoutData.amount || !payoutData.currency || !payoutData.mode) {
            return res.status(400).json({ success: false, message: 'Missing required payout fields' });
        }
        const result = await razorpayXService.createPayout(payoutData);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ─── Webhook router ───────────────────────────────────────────────────────────
// Legacy single-provider webhook (kept for backward compat)
const webhook = async (req, res) => {
    const { provider } = req.params;
    try {
        const result = await orchestrator.handleWebhook(provider, req.body);
        res.json({ success: true, result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const reconcile = async (req, res) => {
    const { provider, orderId } = req.body;
    try {
        const result = await orchestrator.reconcile({ provider, orderId });
        res.json({ success: true, result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = {
    createOrder, verifyPayment, orchestrate, verify: orchestratorVerify,
    getTransactions, getPlans, getPaymentMethods, getProviderHealth,
    // Razorpay subscription
    createRazorpaySubscription, fetchRazorpaySubscription, cancelRazorpaySubscription,
    // Razorpay payment + refund
    createRazorpayRefund, fetchRazorpayPayment,
    // Razorpay webhook
    razorpayWebhook,
    // PayU
    createPayuRefund, getPayuTransaction, createPayuSubscription, cancelPayuSubscription,
    payuWebhook,
    // RazorpayX
    validateFundAccount, createPayout,
    // Legacy
    webhook, reconcile,
};
