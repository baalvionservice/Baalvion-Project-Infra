module.exports = {
  apps: [
    { name: 'trade-documentation-service', script: 'index.js', cwd: __dirname, env: { NODE_ENV: 'production', PORT: 3049 }, autorestart: true, max_restarts: 10 },
  ],
};
