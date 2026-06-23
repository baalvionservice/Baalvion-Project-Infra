// app-edge-realtime — Public BFF + websockets + async dispatch.
// Grouped because all four hold long-lived connections or run worker fleets and benefit
// from being scaled/restarted independently of the request/response apps.
// (proxy-service = consumer/admin BFF; two realtime WS servers; notification workers.)
const ROOT = '/app/Backend/services';
const svc = (name, dir, port, heapMB = 192, maxMemMB = 320) => ({
  name,
  cwd: `${ROOT}/${dir}`,
  script: 'index.js',
  exec_mode: 'fork',
  instances: 1,
  autorestart: true,
  max_restarts: 10,
  kill_timeout: 10000,                             // websocket drain headroom
  node_args: `--max-old-space-size=${heapMB}`,
  max_memory_restart: `${maxMemMB}M`,
  env: { NODE_ENV: 'production', PORT: String(port) },
});

module.exports = {
  apps: [
    svc('proxy-service',      'infrastructure/proxy-service',    4000, 320, 448), // BFF: sockets + payments + S3 + SAML
    svc('realtime-infra',     'infrastructure/realtime-service', 3040, 160, 256), // socket.io fan-out
    svc('realtime-platform',  'platform/realtime-service',       3046, 128, 224), // hand-rolled WS telemetry (PORT remapped off 3026)
    svc('notification-service','infrastructure/notification-service', 3031, 256, 384), // 5 BullMQ workers
  ],
};
