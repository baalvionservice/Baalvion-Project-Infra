// Supplemental pm2 processes that were missing from the running fleet.
// Start with:  pm2 start ecosystem.extra.cjs   (then `pm2 save`)
// These all ship their own node_modules and .env, so no NODE_PATH borrow needed.
const BACKEND = 'D:/Baalvion Projects/Backend/services';
const FRONTEND = 'D:/Baalvion Projects/Frontend';
const base = {
  interpreter: 'node',
  autorestart: true,
  max_memory_restart: '500M',
  // Force IPv4 loopback so ioredis/pg hit Docker (which binds 0.0.0.0 / IPv4),
  // not Windows' ::1 which refuses the connection.
  env: { NODE_ENV: 'development', REDIS_HOST: '127.0.0.1', DB_HOST: '127.0.0.1' },
};

module.exports = {
  apps: [
    { ...base, name: 'about-service',       cwd: `${BACKEND}/ecosystem/about-service`,       script: 'index.js' },
    { ...base, name: 'mining-service',       cwd: `${BACKEND}/ecosystem/mining-service`,      script: 'index.js' },
    { ...base, name: 'market-service',       cwd: `${BACKEND}/commerce/market-service`,       script: 'index.js' },
    { ...base, name: 'real-estate-service',  cwd: `${BACKEND}/ecosystem/real-estate-service`, script: 'index.js' },
    {
      ...base, name: 'mining-web', cwd: `${FRONTEND}/Mining.Baalvion-main`,
      script: './node_modules/next/dist/bin/next', args: 'dev --turbopack -p 3028',
      max_memory_restart: '1500M',
    },
  ],
};
