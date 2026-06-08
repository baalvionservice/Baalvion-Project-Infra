module.exports = {
  apps: [
    { name: 'supplier-lifecycle-service', script: 'index.js', cwd: __dirname, env: { NODE_ENV: 'production', PORT: 3051 }, autorestart: true, max_restarts: 10 },
  ],
};
