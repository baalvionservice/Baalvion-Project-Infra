// ───────────────────────────────────────────────────────────────────────────
// Baalvion local "production-like" reverse proxy  (zero dependencies)
//
// Maps real-looking local domains to the three Next.js frontends AND fronts the
// backend microservices on the SAME origin under /__api/<service>/* so the
// browser never makes a cross-origin or mixed-content request. This mirrors the
// production BFF/gateway pattern: each app talks only to its own origin.
//
//   http://imperialpedia.local         → next app on :3029
//   http://admin.baalvion.local        → next app on :3030
//   http://ir.baalvion.local           → next app on :3027
//   http://founders.baalvion.com       → vite SPA on :8082 (For Investors and Founders)
//   http://proxy.baalvionstack.com     → vite SPA on :8080 (Proxy BaalvionStack)
//   http://<any-app>/__api/<svc>/*     → backend service (path after <svc> kept)
//
// Bind to IPv4 0.0.0.0:80 (Docker Desktop holds IPv6 :: :80, IPv4 is free).
// Targets are tried on 127.0.0.1 then ::1 because the local fleet binds a mix of
// IPv4/IPv6 (a known Windows gotcha in this repo).
// ───────────────────────────────────────────────────────────────────────────
import http from 'node:http';
import net from 'node:net';

const PROXY_PORT = Number(process.env.PROXY_PORT || 80);
const BIND = process.env.PROXY_BIND || '0.0.0.0';
const TARGET_HOSTS = ['127.0.0.1', '::1']; // try IPv4 first, fall back to IPv6

// host → frontend app port. Next.js apps and the two Vite SPAs (served via `vite preview`)
// are both plain HTTP upstreams, so they share one table. Both .local and the real .com
// domains are mapped so either resolves to the same local build.
const APPS = {
  'imperialpedia.local': 3029,
  'admin.baalvion.local': 3030,
  'admin.baalvion.com': 3030,
  'ir.baalvion.local': 3027,
  // Vite SPAs (vite preview — production build)
  'founders.baalvion.local': 8082,
  'founders.baalvion.com': 8082,
  'proxy.baalvionstack.local': 8080,
  'proxy.baalvionstack.com': 8080,
};

// service segment → backend port. Path AFTER /__api/<name> is forwarded as-is,
// so the env URLs carry the per-service base path (/api/v1, /v1, …).
const SERVICES = {
  imperialpedia: 3004,
  cms: 3011,
  admin: 3021,
  session: 3022,
  oauth: 3023,
  proxy: 4000,
  jobs: 3002,
  mining: 3003,
  realEstate: 3005,
  brand: 3006,
  market: 3007,
  ir: 3008,
  dashboard: 3009,
  about: 3020,
  ctm: 3017,
  commerce: 3012,
  orders: 3013,
  inventory: 3014,
  fulfillment: 3016,
  law: 3015,
  rbac: 3055,
  audit: 3032,
  notifications: 3031,
  realtime: 3026,
};

const API_PREFIX = '/__api/';

const hostnameOf = (req) => String(req.headers.host || '').split(':')[0].toLowerCase();

/** Resolve an incoming request to a backend target descriptor (or null). */
function resolveTarget(req) {
  const host = hostnameOf(req);

  if (req.url.startsWith(API_PREFIX)) {
    const rest = req.url.slice(API_PREFIX.length);
    const slash = rest.indexOf('/');
    const name = slash === -1 ? rest : rest.slice(0, slash);
    const tail = slash === -1 ? '/' : rest.slice(slash);
    const port = SERVICES[name];
    if (!port) return null;
    return { port, path: tail || '/', rewriteHost: true, label: `api:${name}` };
  }

  const appPort = APPS[host];
  if (appPort) {
    return { port: appPort, path: req.url, rewriteHost: false, originalHost: req.headers.host, label: `app:${host}` };
  }
  return null;
}

/** Forward an HTTP request, trying each candidate target host family in turn. */
function forward(req, res, target, hostIdx = 0) {
  const targetHost = TARGET_HOSTS[hostIdx];
  if (!targetHost) {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`502 Bad Gateway — no upstream for ${target.label} on :${target.port}`);
    return;
  }

  const headers = { ...req.headers };
  // For backend API hops present the upstream's own host; for app hops keep the
  // real .local host so Next generates correct absolute URLs / cookies.
  headers.host = target.rewriteHost ? `127.0.0.1:${target.port}` : target.originalHost;
  headers['x-forwarded-host'] = target.originalHost || hostnameOf(req);
  headers['x-forwarded-proto'] = 'http';
  headers['x-forwarded-for'] = req.socket.remoteAddress || '';

  const upstream = http.request(
    { host: targetHost, port: target.port, method: req.method, path: target.path, headers, family: targetHost.includes(':') ? 6 : 4 },
    (upRes) => {
      res.writeHead(upRes.statusCode || 502, upRes.headers);
      upRes.pipe(res);
    },
  );

  upstream.on('error', (err) => {
    // Connection-level failure before any bytes → retry the next host family.
    if (!res.headersSent && (err.code === 'ECONNREFUSED' || err.code === 'EADDRNOTAVAIL' || err.code === 'ECONNRESET')) {
      forward(req, res, target, hostIdx + 1);
      return;
    }
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end(`502 Bad Gateway — ${target.label}: ${err.code || err.message}`);
    } else {
      res.destroy();
    }
  });

  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const target = resolveTarget(req);
  if (!target) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end(`404 — unknown host "${req.headers.host}". Add it to APPS in reverse-proxy.mjs and your hosts file.`);
    return;
  }
  forward(req, res, target);
});

// ── WebSocket / HTTP upgrade passthrough (Next HMR in dev, realtime sockets) ──
server.on('upgrade', (req, socket, head) => {
  const target = resolveTarget(req);
  if (!target) {
    socket.destroy();
    return;
  }
  const tryHost = (idx) => {
    const targetHost = TARGET_HOSTS[idx];
    if (!targetHost) {
      socket.destroy();
      return;
    }
    const upstream = net.connect(target.port, targetHost, () => {
      const headerLines = [`${req.method} ${target.path} HTTP/1.1`];
      const h = { ...req.headers };
      h.host = target.rewriteHost ? `127.0.0.1:${target.port}` : target.originalHost;
      for (const [k, v] of Object.entries(h)) headerLines.push(`${k}: ${v}`);
      upstream.write(headerLines.join('\r\n') + '\r\n\r\n');
      if (head && head.length) upstream.write(head);
      socket.pipe(upstream);
      upstream.pipe(socket);
    });
    upstream.on('error', () => tryHost(idx + 1));
  };
  socket.on('error', () => {});
  tryHost(0);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[proxy] FATAL: ${BIND}:${PROXY_PORT} is already in use.`);
    console.error('[proxy] Docker Desktop holds IPv6 :::80 but IPv4 should be free.');
    console.error('[proxy] If this persists, set PROXY_PORT=8080 and use http://<domain>:8080.\n');
  } else {
    console.error('[proxy] server error:', err);
  }
  process.exit(1);
});

server.listen(PROXY_PORT, BIND, () => {
  console.log(`\n  Baalvion local reverse proxy → http://${BIND}:${PROXY_PORT}\n`);
  for (const [host, port] of Object.entries(APPS)) {
    console.log(`   • http://${host}\t→  127.0.0.1:${port}`);
  }
  console.log(`\n   API gateway: http://<app-domain>/__api/<service>/*  (${Object.keys(SERVICES).length} services)\n`);
});
