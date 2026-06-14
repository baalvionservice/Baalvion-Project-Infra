// Extra backend services needed to light up every frontend locally.
// The core 8 (auth/session/oauth/admin/commerce/cms/realtime + admin-platform)
// are in ecosystem.config.js and already running. This file adds the rest.
//
//   pm2 start ecosystem.extra-backends.js
//   pm2 status
const B = 'D:/Baalvion Projects/Backend/services';
const base = { interpreter: 'node', autorestart: true, max_memory_restart: '600M', env: { NODE_ENV: 'development' } };

module.exports = {
  apps: [
    { ...base, name: 'auth-gateway',            cwd: `${B}/identity/auth-gateway`,            script: 'index.js' },
    { ...base, name: 'jobs-service',            cwd: `${B}/ecosystem/jobs-service`,           script: 'index.js' },
    { ...base, name: 'ctm-service',             cwd: `${B}/ecosystem/ctm-service`,            script: 'index.js' },
    { ...base, name: 'ir-service',              cwd: `${B}/ecosystem/ir-service`,             script: 'index.js' },
    { ...base, name: 'brand-connector-service', cwd: `${B}/ecosystem/brand-connector-service`,script: 'index.js' },
    { ...base, name: 'insiders-service',        cwd: `${B}/ecosystem/insiders-service`,       script: 'index.js' },
    { ...base, name: 'dashboard-service',       cwd: `${B}/platform/dashboard-service`,       script: 'index.js' },
    { ...base, name: 'trade-service',           cwd: `${B}/commerce/trade-service`,           script: 'index.js' },
    // order-service REMOVED (consolidated) — order lifecycle owned by trade/order-execution-service.
    { ...base, name: 'inventory-service',       cwd: `${B}/commerce/inventory-service`,       script: 'index.js' },
    { ...base, name: 'proxy-service',           cwd: `${B}/infrastructure/proxy-service`,     script: 'index.js' },
    // ecosystem/commerce content services. localhost->::1 refuses Redis/PG on Windows, so pin IPv4.
    { ...base, name: 'about-service',           cwd: `${B}/ecosystem/about-service`,          script: 'index.js', env: { NODE_ENV: 'development', REDIS_HOST: '127.0.0.1', DB_HOST: '127.0.0.1' } },
    { ...base, name: 'mining-service',          cwd: `${B}/ecosystem/mining-service`,         script: 'index.js', env: { NODE_ENV: 'development', REDIS_HOST: '127.0.0.1', DB_HOST: '127.0.0.1' } },
    { ...base, name: 'market-service',          cwd: `${B}/commerce/market-service`,          script: 'index.js', env: { NODE_ENV: 'development', REDIS_HOST: '127.0.0.1', DB_HOST: '127.0.0.1' } },
    { ...base, name: 'real-estate-service',     cwd: `${B}/ecosystem/real-estate-service`,    script: 'index.js', env: { NODE_ENV: 'development', REDIS_HOST: '127.0.0.1', DB_HOST: '127.0.0.1' } },
  ],
};
