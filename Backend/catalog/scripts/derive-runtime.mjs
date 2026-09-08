#!/usr/bin/env node
/**
 * Derive `spec.runtime` for every catalog descriptor from deploy/consolidated/.
 *
 * Before this, "where does service X answer" was spread across 14 files that disagree with
 * each other — the gateway's proxy.js (all localhost defaults), Traefik's dynamic.yml (an
 * ingress that isn't running), admin-platform's client.ts, health-check.ps1, prometheus.yml,
 * two prose docs, and each service's own code default. A status console built on any of those
 * reports healthy services as down.
 *
 * Only two sources are production truth, because they are what the box actually executes:
 *   deploy/consolidated/pm2/*.config.js      — process -> PORT, and which container supervises it
 *   deploy/consolidated/docker-compose.prod.yml — the standalone containers + their healthchecks
 * The Caddyfile supplies public hostnames on top of those.
 *
 * Descriptors are joined to processes on `metadata.path` <-> pm2 `cwd`, not on name: the pm2
 * process name is an alias in several cases (proxy-platform is supervised as `proxy-service`,
 * the two realtime services run as `realtime-infra` / `realtime-platform`).
 *
 *   node derive-runtime.mjs            # report only, writes nothing
 *   node derive-runtime.mjs --write    # append the runtime block to each descriptor
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const catalogDir = resolve(here, '..');
const servicesDir = join(catalogDir, 'services');
const repoRoot = resolve(catalogDir, '..', '..');
const consolidated = join(repoRoot, 'deploy', 'consolidated');
const require_ = createRequire(import.meta.url);
const WRITE = process.argv.includes('--write');

let YAML;
try { YAML = (await import('yaml')).default ?? (await import('yaml')); }
catch { console.error('skip: install `yaml` to run runtime derivation'); process.exit(0); }

// ── 1. pm2 configs: the consolidated box ─────────────────────────────────────
// Each config file is supervised by exactly one app-* container (compose `command:`).
const PM2_CONTAINER = {
  'identity.config.js':      'app-identity',
  'commerce.config.js':      'app-commerce',
  'ecosystem.config.js':     'app-ecosystem',
  'platform.config.js':      'app-platform',
  'edge-realtime.config.js': 'app-edge-realtime',
  'trade.config.js':         'app-trade',
};

/** path (repo-relative) -> { port, container, pm2Name } */
const deployed = new Map();
for (const [file, container] of Object.entries(PM2_CONTAINER)) {
  const mod = require_(join(consolidated, 'pm2', file));
  for (const app of mod.apps) {
    const port = Number(app.env?.PORT);
    if (!Number.isInteger(port)) continue;
    // cwd is '/app/Backend/services/<domain>/<svc>' inside the image; the descriptor's
    // metadata.path is the same tail, repo-relative.
    const path = app.cwd.replace(/^\/app\//, '');
    const prev = deployed.get(path);
    if (prev) {
      // Two pm2 processes on one directory would be a genuine duplicate; two DIRECTORIES
      // sharing one descriptor (the realtime case) is handled at the descriptor end.
      prev.alsoRunsAs.push({ pm2Name: app.name, port, container });
      continue;
    }
    deployed.set(path, { port, container, pm2Name: app.name, alsoRunsAs: [] });
  }
}

// ── 2. Standalone containers (own image, not pm2-supervised) ─────────────────
// Ports + health paths read off their compose healthchecks. app-payments is Spring Boot,
// so its health endpoint is /actuator/health — a /health probe against it returns 404 and
// would report the entire Java money suite as permanently down.
const STANDALONE = {
  'Backend/services/ecosystem/community-service': { port: 3064, container: 'app-community' },
  'Backend/services/ecosystem/giftcard-service':  { port: 3065, container: 'app-giftcard'  },
  'Backend/services/commerce/financial-services-java/payment-service':
    { port: 3015, container: 'app-payments', healthPath: '/actuator/health' },
};

// ── 3. Health-path exceptions ────────────────────────────────────────────────
// Everything else mounts /health (verified: 63 services define it).
const HEALTH_PATH = {
  'cms-service': '/api/v1/health',
};

// ── 4. Public health URLs ────────────────────────────────────────────────────
// ONLY whole-host Caddy routes, where the edge really does forward every path — so /health
// is reachable from outside. api.baalvion.com and admin.baalvion.com are path carve-outs
// (`handle /api-bff/identity/rbac/*`), which expose no health path at all; guessing one there
// would report a healthy service as down at the edge.
const PUBLIC_HEALTH = {
  'auth-service':      'https://auth-api.baalvion.com/health',
  'news-service':      'https://news.baalvion.com/health',
  'developer-service': 'https://developer-api.baalvion.com/health',
};

// ── 5. Join ──────────────────────────────────────────────────────────────────
const files = readdirSync(servicesDir).filter((f) => f.endsWith('.yaml'));
const rows = [];
const unmatchedDeployments = new Set([...deployed.keys(), ...Object.keys(STANDALONE)]);

for (const file of files) {
  const raw = readFileSync(join(servicesDir, file), 'utf8');
  const doc = YAML.parse(raw);
  const name = doc.metadata.name;
  const path = doc.metadata.path;
  const kind = doc.kind;

  if (kind === 'Library') { rows.push({ file, name, kind, runtime: null, note: 'library — no runtime' }); continue; }

  const box = deployed.get(path);
  const alone = STANDALONE[path];
  const src = box ?? alone;
  unmatchedDeployments.delete(path);

  let runtime;
  if (src) {
    runtime = {
      deployment: box ? 'consolidated-box' : 'standalone',
      port: src.port,
      healthPath: src.healthPath ?? HEALTH_PATH[name] ?? '/health',
      container: src.container,
      ...(PUBLIC_HEALTH[name] ? { publicHealthUrl: PUBLIC_HEALTH[name] } : {}),
    };
  } else {
    runtime = { deployment: 'not-deployed' };
  }
  rows.push({ file, name, kind, runtime, alsoRunsAs: box?.alsoRunsAs ?? [], lifecycle: doc.spec.lifecycle });
}

// ── 6. Report ────────────────────────────────────────────────────────────────
const live = rows.filter((r) => r.runtime && r.runtime.deployment !== 'not-deployed');
const dark = rows.filter((r) => r.runtime && r.runtime.deployment === 'not-deployed');

console.log(`\nRUNNING (${live.length})`);
for (const r of live.sort((a, b) => a.runtime.port - b.runtime.port)) {
  console.log(
    `  ${String(r.runtime.port).padEnd(6)} ${r.name.padEnd(30)} ${r.runtime.container.padEnd(19)}` +
    `${r.runtime.healthPath === '/health' ? '' : r.runtime.healthPath}` +
    `${r.alsoRunsAs.length ? `  (+${r.alsoRunsAs.length} more process)` : ''}`,
  );
}

console.log(`\nDECLARED BUT NOTHING RUNS IT (${dark.length})`);
for (const r of dark) console.log(`  ${r.name.padEnd(30)} ${r.lifecycle}`);

// A port claimed by two containers is fine (container isolation); the same container twice
// is a real collision that would make one of the two unreachable.
const byContainerPort = new Map();
for (const r of live) {
  const key = `${r.runtime.container}:${r.runtime.port}`;
  (byContainerPort.get(key) ?? byContainerPort.set(key, []).get(key)).push(r.name);
}
const collisions = [...byContainerPort].filter(([, v]) => v.length > 1);
console.log(`\nPORT COLLISIONS WITHIN A CONTAINER: ${collisions.length}`);
for (const [k, v] of collisions) console.log(`  ${k} <- ${v.join(', ')}`);

if (unmatchedDeployments.size) {
  console.log(`\nRUNS ON THE BOX BUT HAS NO CATALOG DESCRIPTOR (${unmatchedDeployments.size})`);
  for (const p of unmatchedDeployments) {
    const d = deployed.get(p) ?? STANDALONE[p];
    console.log(`  ${String(d.port).padEnd(6)} ${p}`);
  }
}

const multi = rows.filter((r) => r.alsoRunsAs?.length);
if (multi.length) {
  console.log(`\nONE DESCRIPTOR, SEVERAL PROCESSES (${multi.length})`);
  for (const r of multi) {
    console.log(`  ${r.name}: ${r.runtime.pm2Name ?? r.runtime.container}:${r.runtime.port}` +
      r.alsoRunsAs.map((a) => `, ${a.pm2Name}:${a.port}`).join(''));
  }
}

// ── 7. Write ─────────────────────────────────────────────────────────────────
// Appended as text at the end of `spec:` rather than round-tripped through the YAML
// serialiser, which would strip the hand-written comments these descriptors carry.
if (!WRITE) { console.log('\n(report only — pass --write to apply)'); process.exit(0); }

let written = 0;
for (const r of rows) {
  if (!r.runtime) continue;
  const p = join(servicesDir, r.file);
  let text = readFileSync(p, 'utf8');
  if (/^\s{2}runtime:/m.test(text)) continue;            // idempotent: already applied
  const lines = ['  runtime:', `    deployment: ${r.runtime.deployment}`];
  if (r.runtime.port) {
    lines.push(`    port: ${r.runtime.port}`);
    lines.push(`    healthPath: ${r.runtime.healthPath}`);
    lines.push(`    container: ${r.runtime.container}`);
  }
  if (r.runtime.publicHealthUrl) lines.push(`    publicHealthUrl: ${r.runtime.publicHealthUrl}`);
  writeFileSync(p, `${text.replace(/\s*$/, '')}\n${lines.join('\n')}\n`);
  written++;
}
console.log(`\n${written} descriptors updated.`);
