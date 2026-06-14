module.exports = {
  apps: [
    { name: 'product-registry-service', script: 'index.js', cwd: __dirname, env: { NODE_ENV: 'production', PORT: 3048 }, autorestart: true, max_restarts: 10 },
  ],
};
