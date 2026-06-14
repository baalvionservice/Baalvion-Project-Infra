// Combined pm2 ecosystem for the six GTOS trade services (local dev / prod-on-host).
//   pm2 start Backend/services/trade/ecosystem.gtos.config.js
// Each service also ships its own ecosystem.config.js for isolated runs.
const path = require('path');
const here = (svc) => path.resolve(__dirname, svc);

const svc = (name, port) => ({
  name,
  script: 'index.js',
  cwd: here(name),
  env: { NODE_ENV: 'production', PORT: port },
  autorestart: true,
  max_restarts: 10,
});

module.exports = {
  apps: [
    svc('network-graph-service', 3047),
    svc('product-registry-service', 3048),
    svc('trade-documentation-service', 3049),
    svc('quality-inspection-service', 3050),
    svc('supplier-lifecycle-service', 3051),
    svc('order-execution-service', 3052),
  ],
};
