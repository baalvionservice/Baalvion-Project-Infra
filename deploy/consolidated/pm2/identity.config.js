// app-identity — Identity & trust core (bounded context: identity).
// One container; pm2-runtime supervises each module's own `node index.js` (no code changes).
const ROOT = '/app/Backend/services';
const svc = (name, dir, port, heapMB = 192, maxMemMB = 320) => ({
  name,
  cwd: `${ROOT}/${dir}`,
  script: 'index.js',
  exec_mode: 'fork',
  instances: 1,
  autorestart: true,
  max_restarts: 10,
  kill_timeout: 8000,                              // let @baalvion/graceful-shutdown drain
  node_args: `--max-old-space-size=${heapMB}`,     // per-process V8 heap guardrail
  max_memory_restart: `${maxMemMB}M`,
  env: { NODE_ENV: 'production', PORT: String(port) },
});

module.exports = {
  apps: [
    svc('auth-service',    'identity/auth-service',    3001, 256, 384),
    svc('auth-gateway',    'identity/auth-gateway',    3026, 160, 256),
    svc('oauth-service',   'identity/oauth-service',   3023),
    svc('rbac-service',    'identity/rbac-service',    3053),
    svc('session-service', 'identity/session-service', 3022, 224, 320), // geoip-lite in-mem DB
  ],
};
