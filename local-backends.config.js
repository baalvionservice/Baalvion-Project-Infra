// Local host pm2 backends — just what's needed to test Amarise + Proxy + Admin.
//
//   pm2 start local-backends.config.js
//   pm2 status / pm2 logs <name>
//   pm2 delete local-backends.config.js   # tear down
//
// Infra (postgres/redis/pgadmin) + cms(:3011) + rbac(:3055) stay in Docker and are
// NOT managed here. App backends run on the host because the Docker build for them
// currently fails on a pnpm frozen-lockfile/overrides mismatch.
//
// DB_HOST/REDIS_HOST are pinned to 127.0.0.1 — on Windows `localhost` resolves to ::1
// first and breaks node-postgres / ioredis even though Docker dual-stacks the port.
const ID = 'D:/Baalvion Projects/Backend/services/identity';
const PL = 'D:/Baalvion Projects/Backend/services/platform';
const CM = 'D:/Baalvion Projects/Backend/services/commerce';
const IN = 'D:/Baalvion Projects/Backend/services/infrastructure';

const net = { DB_HOST: '127.0.0.1', REDIS_HOST: '127.0.0.1', REDIS_URL: 'redis://127.0.0.1:6379' };
const base = { interpreter: 'node', autorestart: true, max_memory_restart: '600M', min_uptime: 5000, max_restarts: 8 };
const svc = (name, cwd, env = {}) => ({ ...base, name, cwd, script: 'index.js', env: { NODE_ENV: 'development', ...net, ...env } });

module.exports = {
  apps: [
    // identity
    svc('auth-service',      `${ID}/auth-service`),                                       // :3001
    svc('session-service',   `${ID}/session-service`),                                    // :3022
    svc('oauth-service',     `${ID}/oauth-service`),                                       // :3023
    // platform
    svc('admin-service',     `${PL}/admin-service`),                                       // :3021
    svc('realtime-service',  `${PL}/realtime-service`, { NODE_PATH: `${ID}/session-service/node_modules` }), // :3026
    // commerce (RBAC PEP -> rbac PDP in Docker on :3055)
    svc('commerce-service',  `${CM}/commerce-service`, { RBAC_BASE_URL: 'http://127.0.0.1:3055' }), // :3012
    svc('order-service',     `${CM}/order-service`,    { RBAC_BASE_URL: 'http://127.0.0.1:3055' }), // :3013
    svc('inventory-service', `${CM}/inventory-service`),                                   // :3014
    // infrastructure (Proxy SaaS backend)
    svc('proxy-service',     `${IN}/proxy-service`),                                       // :4000
  ],
};
