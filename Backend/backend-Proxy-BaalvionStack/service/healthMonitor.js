// Background health monitor for all providers
const providers = {
  razorpay: require('./providers/razorpayService'),
  payu: require('./providers/payuService'),
};
const healthStore = require('./healthStore');
const logger = require('./logger');

const CHECK_INTERVAL = 5000; // 5 seconds

async function checkProvider(providerName, providerService) {
  // If in cooldown, skip health check
  const cooldownUntil = providerService.getCooldownUntil && providerService.getCooldownUntil();
  if (cooldownUntil && Date.now() < cooldownUntil) return;

  const result = await providerService.healthCheck();
  healthStore.set(providerName, result);
  logger.info(`[HealthMonitor] ${providerName} status: ${result.status}, latency: ${result.latency}ms`);
}

function start() {
  setInterval(() => {
    for (const [name, service] of Object.entries(providers)) {
      checkProvider(name, service);
    }
  }, CHECK_INTERVAL);
}

module.exports = { start };