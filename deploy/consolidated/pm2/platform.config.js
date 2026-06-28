// app-platform — Back-office: platform + knowledge + infra utilities.
// (bounded contexts: platform, knowledge[Node], infrastructure[non-realtime]).
// ml-service (Python) ships separately and is OFF by default (Node has an in-process fallback).
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
    // platform
    svc('admin-service',         'platform/admin-service',         3021),
    svc('dashboard-service',     'platform/dashboard-service',     3009),
    svc('tenant-service',        'platform/tenant-service',        3043),
    // knowledge (Node)
    // cms-service. On publish/edit it POSTs each public site's /api/revalidate webhook
    // (instant ISR refresh + IndexNow search ping). REVALIDATE_SECRET comes from the box
    // .env and MUST match each frontend's REVALIDATE_SECRET; the URL map is non-secret.
    {
      ...svc('cms-service', 'knowledge/cms-service', 3018, 256, 384), // BullMQ media
      env: {
        NODE_ENV: 'production',
        PORT: '3018',
        REVALIDATE_SECRET: process.env.REVALIDATE_SECRET || '',
        REVALIDATE_WEBHOOKS: JSON.stringify({
          imperialpedia: 'https://imperialpedia.com/api/revalidate',
          'about-baalvion': 'https://about.baalvion.com/api/revalidate',
          'baalvion-ir': 'https://ir.baalvion.com/api/revalidate',
          'law-elite-network': 'https://lawelitenetwork.com/api/revalidate',
        }),
      },
    },
    svc('imperialpedia-service', 'knowledge/imperialpedia-service',3004),
    svc('law-service',           'knowledge/law-service',          3015, 256, 384), // multer/S3/ws + billing worker
    // infrastructure utilities (non-realtime)
    svc('audit-service',         'infrastructure/audit-service',   3032),
    svc('developer-service',     'infrastructure/developer-service',3042),
    svc('report-service',        'infrastructure/report-service',  3041, 224, 320), // pdf/excel on demand
    svc('search-service',        'infrastructure/search-service',  3036, 224, 320), // OpenSearch client
  ],
};
