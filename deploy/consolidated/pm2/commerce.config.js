// app-commerce — Commerce + marketplace (bounded context: commerce, marketplace).
// financial-services-java is NOT here — the JVM ships as the separate app-payments container.
// SLIMMED for the consolidated box: only the services the central admin console manages run
// here, EXCEPT order-service, which is re-added below. The comment this replaced called
// order-service "deprecated" in favor of the trade domain's order-execution-service, but that's
// a different bounded context (GTI/trade B2B) with no relationship to order-service's real
// consumer: Market Underworld's cart/checkout/payments/wishlists/returns/consignments/
// appointments (Caddyfile's @order_service carve-out has been proxying to app-commerce:3013
// this whole time regardless). Without it running, the entire buyer purchase flow 502s.
// trade-service IS now here. It was previously omitted for having no admin-console panel,
// which was true and is no longer the whole story: it owns the `tradeops` schema and serves
// the PUBLIC World Shipping Directory at /v1/public/shipping/* (ships.baalvion.com, ~99,700
// pages). Those routes carry no auth and no tenant data by design — see
// routes/shippingDirectoryRoutes.js — but they cannot serve at all unless this process runs.
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
    svc('order-service',       'commerce/order-service',       3013, 192, 320),
    // Reads are aggregate-heavy (cohort rollups, a 40k-row sitemap page) over ~96k vessel
    // rows, so it gets more headroom than the default 192/320.
    svc('trade-service',       'commerce/trade-service',       3025, 320, 448),
  ],
};
