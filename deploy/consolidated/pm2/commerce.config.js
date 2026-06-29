// app-commerce — Commerce + marketplace (bounded context: commerce, marketplace).
// financial-services-java is NOT here — the JVM ships as the separate app-payments container.
// SLIMMED for the consolidated box: only the services the central admin console manages run
// here. order-service is deprecated (its lifecycle moved to the trade domain's
// order-execution-service) and trade-service has no admin-console panel, so both are omitted
// to keep the 3.7GB box lean. Re-add them here if a console surface needs them.
const ROOT = '/app/Backend/services';
const svc = (name, dir, port, heapMB = 192, maxMemMB = 320) => ({
  name,
  cwd: `${ROOT}/${dir}`,
  script: 'index.js',
  exec_mode: 'fork',
  instances: 1,
  autorestart: true,
  max_restarts: 10,
  kill_timeout: 8000,
  node_args: `--max-old-space-size=${heapMB}`,
  max_memory_restart: `${maxMemMB}M`,
  env: { NODE_ENV: 'production', PORT: String(port) },
});

module.exports = {
  apps: [
    svc('commerce-service',    'commerce/commerce-service',    3012, 256, 384), // BullMQ + media
    svc('inventory-service',   'commerce/inventory-service',   3014),
    svc('fulfillment-service', 'commerce/fulfillment-service', 3016),
    svc('market-service',      'commerce/market-service',      3007),
    svc('marketplace-service', 'marketplace/marketplace-service', 3060),
  ],
};
