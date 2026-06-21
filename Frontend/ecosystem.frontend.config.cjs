/**
 * PM2 ecosystem config for the Baalvion frontend web apps.
 *
 * WHY THIS EXISTS — restart hardening for the Windows `next start` port race:
 * on a restart the old process can keep holding :PORT for a moment after it
 * exits, so the new instance hits `EADDRINUSE` and crashes. Without backoff,
 * PM2 immediately retries into the same collision → a crash loop that burns the
 * restart budget and leaves the app "stopped". The settings below fix that:
 *
 *   - exp_backoff_restart_delay : after a crash, wait (250ms → 500 → 1000 …)
 *                                 before retrying, so the socket frees and the
 *                                 next bind succeeds (self-healing, no loop).
 *   - kill_timeout              : give the app 8s to release the socket on
 *                                 SIGINT before PM2 sends SIGKILL.
 *   - min_uptime / max_restarts : a start must stay up 10s to count as stable;
 *                                 give up after 15 unstable restarts.
 *
 * Each app loads its own `.env` from its cwd (via Next/Vite) at runtime, so no
 * env is injected here — this only changes the restart policy, not behavior.
 *
 * Apply:   pm2 startOrReload Frontend/ecosystem.frontend.config.cjs   (then: pm2 save)
 * One app: pm2 startOrReload Frontend/ecosystem.frontend.config.cjs --only about-web
 */

const harden = {
  interpreter: 'node',
  exec_mode: 'fork',
  autorestart: true,
  kill_timeout: 8000,
  min_uptime: 10000,
  max_restarts: 15,
  exp_backoff_restart_delay: 250,
};

const next = (name, dir, port, cmd = 'start') => ({
  ...harden,
  name,
  cwd: `./${dir}`,
  script: 'node_modules/next/dist/bin/next',
  args: `${cmd} -p ${port}`,
});

const vite = (name, dir, port) => ({
  ...harden,
  name,
  cwd: `./${dir}`,
  script: 'node_modules/vite/bin/vite.js',
  args: `preview --port ${port} --host`,
});

module.exports = {
  apps: [
    next('about-web', 'about-baalvion-main', 3020),
    next('ir-web', 'IR-Baalvion-main', 3027),
    // baalvion-com uses `output: 'export'` (static) + Cloudflare/wrangler in prod,
    // so `next start` refuses to serve it. Run `next dev` locally instead.
    next('baalvion-com-web', 'baalvion-com-main', 3043, 'dev'),
    next('imperialpedia-web', 'Imperialpedia-main', 3029),
    next('gti-web', 'Global-Trade-Infrastructure-main', 9003),
    next('law-web', 'Law-Elite-Network-main', 9002),
    next('amarise-web', 'AmariseMaisonAvenue-main', 3033),
    next('ctm-web', 'controlthemarket-main', 3034),
    next('brand-web', 'brand-connector-main', 3035),
    next('mining-web', 'Mining.Baalvion-main', 3028),
    next('jobs-web', 'Baalvion-Jobs-Portal-main', 3026), // production `next start`
    next('admin-platform', 'admin-platform', 3030),
    next('dashboard-web', 'company-unified-Dashboard-main', 3024),
    vite('founders-web', 'For Invstors and Founders', 8082),
    vite('proxy-web', 'Proxy-BaalvionStack', 8080),
  ],
};
