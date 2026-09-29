// All stopped frontends, booted in dev mode via pm2.
// pm2 on Windows can't exec npm.cmd, so we run the next/vite binary directly.
// Port clashes resolved: Jobs -> 3026 (realtime-service moved to its contract port :3040), Proxy -> 8090 (8080 is Insiders).
//
//   pm2 start frontends.config.js
//   pm2 status
const F = 'D:/Baalvion Projects/Frontend';
const NEXT = './node_modules/next/dist/bin/next';
const VITE = './node_modules/vite/bin/vite.js';
const base = { interpreter: 'node', autorestart: true, min_uptime: 8000, max_restarts: 5, max_memory_restart: '1500M' };

const next = (name, dir, port, env = {}) => ({
  ...base, name, cwd: `${F}/${dir}`, script: NEXT, args: `dev -p ${port}`,
  env: { NODE_ENV: 'development', ...env },
});
const vite = (name, dir, port, env = {}) => ({
  ...base, name, cwd: `${F}/${dir}`, script: VITE, args: `--port ${port} --host`,
  env: { NODE_ENV: 'development', ...env },
});

module.exports = {
  apps: [
    // --- Next.js apps ---
    next('about-web',        'about.baalvion.com',              3020),
    next('ir-web',           'ir.baalvion.com',                 3027),
    next('amarise-web',      'amarisemaisonavenue.com',         3033),
    next('gti-web',          'Global-Trade-Infrastructure-main', 9003),
    next('jobs-web',         'jobs.baalvion.com',        3026, { NEXT_PUBLIC_APP_URL: 'http://localhost:3026' }),
    next('newaiskillsteam.baalvion.com-web', 'newaiskillsteam.baalvion.com',           3034),
    next('dashboard-web',    'dashboard.baalvion.com',   3024),
    next('law-web',          'lawelitenetwork.com',           9002),
    next('brand-web',        'connect.baalvion.com',             3035),
    next('mining-web',       'mining.baalvion.com',             3028),
    // Absent until 2026-09: CI derives its frontend build matrix from this list,
    // so Imperialpedia was the one production site CI never built.
    next('imperialpedia-web','Imperialpedia-nextjs-main',               3029),
    next('canwemarry-web',   'canwemarry.baalvion.com',                  3071),

    // --- Vite SPAs ---
    vite('insiders-web',     'marketunderworld.com',        8080),
    vite('proxy-web',        'proxy.baalvionstack.com',              8090, {
      VITE_API_PLATFORM_BASE_URL: 'http://localhost:4000/v1',
      VITE_API_AUTH_BASE_URL:     'http://localhost:4000/v1/auth',
      VITE_AUTH_PROXY_TARGET:     'http://localhost:4000/v1/auth',
    }),
  ],
};
