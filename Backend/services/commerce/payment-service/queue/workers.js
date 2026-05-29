/**
 * BullMQ workers for payment-service
 * (async payment routing, settlement batching, webhooks, etc.)
 */

let workers = [];

function startWorkers() {
  console.log('[payment-service] Queue workers started (placeholder)');
  // In production: initialize workers for async payment routing
}

function stopWorkers() {
  workers.forEach((w) => w.close());
  console.log('[payment-service] Queue workers stopped');
}

module.exports = {
  startWorkers,
  stopWorkers,
};
