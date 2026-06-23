// app-commerce — Commerce + marketplace (bounded context: commerce, marketplace).
// financial-services-java is NOT here — the JVM ships as the separate app-payments container.
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
    svc('order-service',       'commerce/order-service',       3013, 256, 384), // reconciliation worker
    svc('trade-service',       'commerce/trade-service',       3025, 256, 448), // ws + doc/logistics engines
    svc('marketplace-service', 'marketplace/marketplace-service', 3060),
  ],
};
