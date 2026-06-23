// app-trade — Global trade platform (bounded context: trade).
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
    svc('network-graph-service',       'trade/network-graph-service',       3047, 224, 320), // Neo4j pool
    svc('order-execution-service',     'trade/order-execution-service',     3052, 256, 384), // outbox/saga workers
    svc('product-registry-service',    'trade/product-registry-service',    3048),
    svc('quality-inspection-service',  'trade/quality-inspection-service',  3050),
    svc('supplier-lifecycle-service',  'trade/supplier-lifecycle-service',  3051),
    svc('trade-documentation-service', 'trade/trade-documentation-service', 3049),
  ],
};
