// pm2 process definition for marketplace-service (local dev/prod-on-host).
// NODE_PATH points at ir-service's installed node_modules so the service runs without a
// dedicated `pnpm install` (its deps are a strict subset). Replace with a real install
// (pnpm -F marketplace-service install) when promoting to CI/containers.
const path = require('path');
const irNodeModules = path.resolve(__dirname, '../../ecosystem/ir-service/node_modules');

module.exports = {
  apps: [
    {
      name: 'marketplace-service',
      script: 'index.js',
      cwd: __dirname,
      env: {
        NODE_PATH: irNodeModules,
        NODE_ENV: 'production',
      },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
