// pm2 process definition for order-execution-service (local dev / prod-on-host).
module.exports = {
  apps: [
    {
      name: 'order-execution-service',
      script: 'index.js',
      cwd: __dirname,
      // Local bring-up runs in development to match the host pm2 fleet; real deploys set
      // NODE_ENV=production in the orchestrator with real GATEWAY_SIGNING_SECRET / FINANCE_WEBHOOK_SECRET
      // (appConfig fail-fasts on dev-default secrets under production — by design).
      env: { NODE_ENV: 'development', PORT: 3052 },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
