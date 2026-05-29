/**
 * BullMQ workers for background jobs
 * (settlement batching, reconciliation, report generation, etc.)
 */

let workers = [];

function startWorkers() {
  console.log('[ledger-service] Queue workers started (placeholder)');
  // In production, would initialize BullMQ workers here
}

function stopWorkers() {
  workers.forEach((w) => w.close());
  console.log('[ledger-service] Queue workers stopped');
}

module.exports = {
  startWorkers,
  stopWorkers,
};
