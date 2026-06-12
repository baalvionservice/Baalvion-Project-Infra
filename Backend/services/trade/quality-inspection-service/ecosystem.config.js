module.exports = {
  apps: [
    { name: 'quality-inspection-service', script: 'index.js', cwd: __dirname, env: { NODE_ENV: 'production', PORT: 3050 }, autorestart: true, max_restarts: 10 },
  ],
};
