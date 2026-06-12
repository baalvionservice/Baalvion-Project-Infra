// pm2 process definition for network-graph-service (local dev / prod-on-host).
module.exports = {
  apps: [
    {
      name: 'network-graph-service',
      script: 'index.js',
      cwd: __dirname,
      env: { NODE_ENV: 'production', PORT: 3047 },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
