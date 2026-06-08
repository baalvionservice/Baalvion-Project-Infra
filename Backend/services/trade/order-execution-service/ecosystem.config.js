// pm2 process definition for order-execution-service (local dev / prod-on-host).
module.exports = {
  apps: [
    {
      name: 'order-execution-service',
      script: 'index.js',
      cwd: __dirname,
      env: { NODE_ENV: 'production', PORT: 3052 },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
