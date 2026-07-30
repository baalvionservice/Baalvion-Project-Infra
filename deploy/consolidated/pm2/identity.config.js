// app-identity — Identity & trust core (bounded context: identity).
// One container; pm2-runtime supervises each module's own `node index.js` (no code changes).
const ROOT = '/app/Backend/services';
const svc = (name, dir, port, heapMB = 192, maxMemMB = 320, extraEnv = {}) => ({
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
  env: { NODE_ENV: 'production', PORT: String(port), ...extraEnv },
});

module.exports = {
  apps: [
    svc('auth-service',    'identity/auth-service',    3001, 256, 384),
    // auth-gateway proxies /login, /register, /refresh straight onto `${AUTH_SERVICE_URL}${path}`
    // (no /v1/auth appended in its own code — see auth-gateway/config/appConfig.js's default of
    // .../3001/v1/auth). Every OTHER consumer's shared AUTH_SERVICE_URL (deploy/consolidated/.env,
    // e.g. http://app-identity:3001) omits that suffix because THEY append /v1/auth/... themselves.
    // Inheriting the shared container-wide value here made auth-gateway call bare /login instead of
    // /v1/auth/login, which auth-service 404s (no such route) — this broke login/register/refresh
    // through every frontend using the gateway BFF (createGatewaySession), sitewide.
    svc('auth-gateway',    'identity/auth-gateway',    3026, 160, 256, { AUTH_SERVICE_URL: 'http://localhost:3001/v1/auth' }),
    svc('oauth-service',   'identity/oauth-service',   3023),
    svc('rbac-service',    'identity/rbac-service',    3053),
    svc('session-service', 'identity/session-service', 3022, 224, 320), // geoip-lite in-mem DB
  ],
};
