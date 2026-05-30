// pm2 process manager for the full local Baalvion stack.
//
//   pm2 start ecosystem.config.js     # start everything (auto-restart on crash)
//   pm2 save                          # persist the process list
//   pm2 resurrect                     # restore after reboot (wired to logon task)
//   pm2 status / pm2 logs <name>      # inspect
//
// Datastores (postgres, redis, minio, prometheus, grafana) run in Docker and are
// NOT managed here — start them with their compose files.
const BACKEND = 'D:/Baalvion Projects/Backend/services';
const base = { interpreter: 'node', autorestart: true, max_memory_restart: '500M', env: { NODE_ENV: 'development' } };

module.exports = {
  apps: [
    { ...base, name: 'auth-service',      cwd: `${BACKEND}/identity/auth-service`,    script: 'index.js' },
    { ...base, name: 'session-service',   cwd: `${BACKEND}/identity/session-service`, script: 'index.js' },
    { ...base, name: 'oauth-service',     cwd: `${BACKEND}/identity/oauth-service`,   script: 'index.js' },
    { ...base, name: 'admin-service',     cwd: `${BACKEND}/platform/admin-service`,   script: 'index.js' },
    { ...base, name: 'commerce-service',  cwd: `${BACKEND}/commerce/commerce-service`,script: 'index.js' },
    { ...base, name: 'cms-service',       cwd: `${BACKEND}/knowledge/cms-service`,    script: 'index.js' },
    {
      ...base, name: 'realtime-service', cwd: `${BACKEND}/platform/realtime-service`, script: 'index.js',
      // realtime-service borrows pg/ioredis/jsonwebtoken from session-service's modules.
      env: { NODE_ENV: 'development', NODE_PATH: `${BACKEND}/identity/session-service/node_modules` },
    },
    {
      ...base, name: 'admin-platform', cwd: 'D:/Baalvion Projects/Frontend/admin-platform',
      script: './node_modules/next/dist/bin/next', args: 'dev --port 3030', max_memory_restart: '1500M',
    },
  ],
};
