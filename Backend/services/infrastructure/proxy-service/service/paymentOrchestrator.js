// Payment Orchestrator Service
const razorpayService = require('./providers/razorpayService');
const payuService = require('./providers/payuService');
const reconciliation = require('./paymentReconciliation');


// Always check provider health live (not cached)
async function getAllProviderHealth() {
  const results = {};
  for (const provider of providers) {
    if (typeof provider.service.healthCheck === 'function') {
      results[provider.name] = await provider.service.healthCheck();
    } else {
      results[provider.name] = { status: 'unknown', latency: null };
    }
  }
  return results;
}

const providers = [
  { name: 'razorpay', service: razorpayService },
  { name: 'payu', service: payuService },
];

// Orchestrate payment with retry/failover
async function orchestratePayment({ amount, currency, receipt, provider: preferredProvider, maxRetries = 2 }) {
  console.log('[Orchestrator] orchestratePayment called with:', { amount, currency, receipt, preferredProvider, maxRetries });
  let lastError = null;
  let selectedProvider = providers.find(p => p.name === preferredProvider);
  if (!selectedProvider) {
    throw new Error('Invalid or missing payment provider');
  }
  let finalAmount = amount;
  // Razorpay expects amount in paise (multiply by 100)
  if (selectedProvider.name === 'razorpay') {
    finalAmount = Math.round(amount * 100);
  }
  try {
    console.log(`[Orchestrator] Trying provider: ${selectedProvider.name}`);
    const order = await selectedProvider.service.createOrder(finalAmount, currency, receipt);
    console.log(`[Orchestrator] Order created successfully with ${selectedProvider.name}:`, order);
    return { provider: selectedProvider.name, order };
  } catch (err) {
    console.error(`[Orchestrator] ${selectedProvider.name} createOrder failed:`, err);
    lastError = err;
    throw lastError || new Error('Payment provider failed');
  }
}
// Webhook-based verification entry point
async function handleWebhook(provider, webhookData) {
  if (!providersMap[provider]) throw new Error('Unknown provider');
  // Each provider should implement its own webhook handler/validator
  return providersMap[provider].service.handleWebhook(webhookData);
}

// Reconciliation entry point
async function reconcile({ provider, orderId }) {
  return reconciliation.reconcilePayment({ provider, orderId });
}


async function verifyPayment(provider, paymentData) {
  const selected = providers.find(p => p.name === provider);
  if (!selected) throw new Error('Unknown provider');
  return selected.service.verifyPayment(paymentData);
}

const providersMap = providers.reduce((acc, p) => { acc[p.name] = p; return acc; }, {});
module.exports = { orchestratePayment, verifyPayment, getAllProviderHealth, handleWebhook, reconcile };