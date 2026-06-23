// app-ecosystem — Vertical/ecosystem apps (bounded context: ecosystem).
// law-elite is intentionally EXCLUDED — it is an in-memory demo shell, not a real service.
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
    svc('about-service',           'ecosystem/about-service',           3010),
    svc('agent-service',           'ecosystem/agent-service',           3044),
    svc('brand-connector-service', 'ecosystem/brand-connector-service', 3006),
    svc('crm-service',             'ecosystem/crm-service',             3063),
    svc('ctm-service',             'ecosystem/ctm-service',             3017, 224, 320), // dual payment SDKs
    svc('insiders-service',        'ecosystem/insiders-service',        3050),           // distinct container ∴ ok
    svc('ir-service',              'ecosystem/ir-service',              3008),
    svc('jobs-service',            'ecosystem/jobs-service',            3002, 384, 512), // Elasticsearch + 4 workers
    svc('mining-service',          'ecosystem/mining-service',          3003),
    svc('real-estate-service',     'ecosystem/real-estate-service',     3005),
  ],
};
