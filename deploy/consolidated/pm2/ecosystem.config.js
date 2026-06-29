// app-ecosystem — Vertical/ecosystem apps (bounded context: ecosystem).
// law-elite is intentionally EXCLUDED — it is an in-memory demo shell, not a real service.
// SLIMMED for the consolidated box: only the ecosystem services the central admin console
// manages run here (crm, ir) + jobs (TalentOS backend for jobs.baalvion.com — its Vercel FE
// reaches it via the Caddy route /api-bff/ecosystem/jobs/* → :3002). ctm is linked out to its
// own deployment (controlthemarket.com); mining/brand/real-estate/about/insiders/agent have no
// admin-console panel and run in their own standalone deployments, not on this box.
// jobs-service auto-creates its `jobs` schema + tables on boot (sequelize.sync) and verifies
// RS256 with the same JWT_PUBLIC_KEY ir-service already uses — no extra env/migration needed.
// This keeps the 3.7GB box within memory. NOTE: the app-ecosystem healthcheck in the compose
// probes ir-service (3008) — keep a kept service on that port if this list changes.
const ROOT = '/app/Backend/services';
const svc = (name, dir, port, heapMB = 192, maxMemMB = 320) => ({
  name,
  cwd: `${ROOT}/${dir}`,
  script: 'index.js',
  exec_mode: 'fork',
  instances: 1,
  autorestart: true,
  max_restarts: 10,
  kill_timeout: 8000,
  node_args: `--max-old-space-size=${heapMB}`,
  max_memory_restart: `${maxMemMB}M`,
  env: { NODE_ENV: 'production', PORT: String(port) },
});

module.exports = {
  apps: [
    svc('crm-service',             'ecosystem/crm-service',             3063),
    svc('ir-service',              'ecosystem/ir-service',              3008),
    // jobs-service runs 4 in-process BullMQ workers + bull-board → a little more heap/cap than
    // the default. ~448M cap keeps app-ecosystem (crm 320 + ir 320 + jobs 448 = 1088M) under
    // its 1536m mem_limit. Port 3002 = the Caddy /api-bff/ecosystem/jobs/* target.
    svc('jobs-service',            'ecosystem/jobs-service',            3002, 256, 448),
  ],
};
