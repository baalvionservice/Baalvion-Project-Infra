#!/usr/bin/env node
/**
 * baalctl — the Baalvion platform CLI (golden-path developer experience).
 *
 *   baalctl new service <name> --division <d> --context <c> --owner <team> [--lang node|go|python]
 *   baalctl catalog validate          # run the catalog governance gate
 *   baalctl catalog list              # list services + tiers + owners
 *   baalctl events list               # list domain-event types from the contracts registry
 *   baalctl graph                     # print the service dependency graph
 *
 * Zero runtime deps for the core; scaffolding writes a catalog descriptor + a
 * Helm values file so a new service is registered + deployable in one command.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Walk up from this file to the monorepo root (the dir holding pnpm-workspace.yaml).
// Robust against baalctl itself being relocated (e.g. platform/cli → Backend/platform/cli).
function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return join(start, '..', '..'); // fallback: original assumption
}

const REPO = findRepoRoot(dirname(fileURLToPath(import.meta.url)));
const SERVICES = join(REPO, 'Backend', 'catalog', 'services');
const VALUES_DIR = join(REPO, 'Backend', 'infra', 'helm', 'baalvion-service');
const EVENTS = join(REPO, 'Backend', 'packages', 'contracts', 'events');

const [, , cmd, sub, ...rest] = process.argv;
const flags = parseFlags(rest);

function parseFlags(args) {
  const f = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { f[args[i].slice(2)] = args[i + 1]?.startsWith('--') || args[i + 1] === undefined ? true : args[++i]; }
    else positional.push(args[i]);
  }
  f._ = positional;
  return f;
}

function die(msg) { console.error(`error: ${msg}`); process.exit(1); }

function newService() {
  const name = flags._[0];
  if (!name || !/^[a-z][a-z0-9-]+$/.test(name)) die('usage: baalctl new service <kebab-name> --domain <identity|commerce|knowledge|infrastructure|platform|ecosystem> --division <d> --context <c> --owner @baalvion/<team>');
  const division = flags.division || 'platform-core';
  const context = flags.context || name.replace(/-platform$|-service$/, '');
  const owner = flags.owner || '@baalvion/platform-core';
  const lang = flags.lang || 'node';
  const ns = flags.namespace || 'baalvion';
  // Locked 6-domain architecture axis. Inferred from division if not supplied.
  const DOMAINS = ['identity', 'commerce', 'knowledge', 'infrastructure', 'platform', 'ecosystem'];
  const inferDomain = { 'platform-core': 'platform', 'proxy-infrastructure': 'infrastructure', 'shared-developer-platform': 'infrastructure', commerce: 'commerce', mining: 'ecosystem', legal: 'ecosystem', 'real-estate': 'ecosystem', jobs: 'ecosystem' };
  const domain = flags.domain || inferDomain[division] || 'ecosystem';
  if (!DOMAINS.includes(domain)) die(`--domain must be one of: ${DOMAINS.join(', ')}`);

  const descriptorPath = join(SERVICES, `${name}.yaml`);
  if (existsSync(descriptorPath)) die(`${name} already exists in the catalog`);

  writeFileSync(descriptorPath, `apiVersion: baalvion.io/v1
kind: Service
metadata:
  name: ${name}
  description: TODO — describe this bounded context.
  domain: ${domain}
  division: ${division}
  context: ${context}
  owner: "${owner}"
  tier: tier-2
  repo: baalvion-platform
  path: Backend/services/${domain}/${name}
spec:
  lifecycle: experimental
  language: ${lang}
  datastores: [postgres]
  dependsOn: [identity-platform]
  consumesEvents: []
  producesEvents: []
  apis: ["/v1/${context}"]
  slo: { availability: 0.99, latencyP95Ms: 500 }
  deploy: { chart: baalvion-service, namespace: ${ns}, minReplicas: 2, maxReplicas: 10 }
`);

  writeFileSync(join(VALUES_DIR, `values-${name}.yaml`), `nameOverride: ${name}
namespace: ${ns}
division: ${division}
tier: tier-2
image:
  repository: ghcr.io/baalvion/${name}
  tag: latest
command: ["node", "server.js"]
containerPort: 3000
replicas: { min: 2, max: 10, targetCPUUtilization: 70 }
`);

  // Create the service code home in its domain folder (ARCHITECTURE.md §2).
  const codeDir = join(REPO, 'Backend', 'services', domain, name);
  if (!existsSync(codeDir)) mkdirSync(codeDir, { recursive: true });
  const pkgPath = join(codeDir, 'package.json');
  if (!existsSync(pkgPath)) {
    writeFileSync(pkgPath, JSON.stringify({
      name: `@baalvion/${name}`,
      version: '0.0.0',
      private: true,
      description: `${context} (${domain} domain)`,
      main: 'server.js',
      scripts: { start: 'node server.js' },
    }, null, 2) + '\n');
  }
  if (!existsSync(join(codeDir, 'README.md'))) {
    writeFileSync(join(codeDir, 'README.md'), `# ${name}\n\nDomain: **${domain}** · Context: **${context}** · Owner: ${owner}\n\nScaffold the service with \`@baalvion/service-kit\`'s \`createService()\`. Verify identity\nvia \`@baalvion/auth-node\` (never import \`jsonwebtoken\` directly — rule A1). Expose its\npublic surface through \`@baalvion/contracts\`. See \`Backend/ARCHITECTURE.md\`.\n`);
  }

  console.log(`✓ created Backend/catalog/services/${name}.yaml`);
  console.log(`✓ created Backend/infra/helm/baalvion-service/values-${name}.yaml`);
  console.log(`✓ created Backend/services/${domain}/${name}/ (package.json + README)`);
  console.log(`\nNext:\n  1. baalctl catalog validate\n  2. scaffold code with @baalvion/service-kit's createService() in Backend/services/${domain}/${name}\n  3. add @baalvion/contracts proto/events for its public surface\n  4. open a PR — ArgoCD ApplicationSet provisions it on merge.`);
}

async function loadYaml() {
  try { const m = await import('yaml'); return m.default ?? m; } catch { return null; }
}

async function catalogList() {
  const YAML = await loadYaml();
  const rows = readdirSync(SERVICES).filter((f) => f.endsWith('.yaml')).map((f) => {
    const d = YAML ? YAML.parse(readFileSync(join(SERVICES, f), 'utf8')) : naiveParse(readFileSync(join(SERVICES, f), 'utf8'));
    return d.metadata;
  });
  console.log('SERVICE'.padEnd(26), 'DIVISION'.padEnd(22), 'TIER'.padEnd(8), 'OWNER');
  for (const m of rows.sort((a, b) => (a.tier || '').localeCompare(b.tier || ''))) {
    console.log(String(m.name).padEnd(26), String(m.division).padEnd(22), String(m.tier).padEnd(8), m.owner);
  }
}

// Tiny fallback parser for `metadata` block when `yaml` isn't installed.
function naiveParse(text) {
  const meta = {};
  let inMeta = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('metadata:')) { inMeta = true; continue; }
    if (inMeta && /^\S/.test(line)) break;
    const m = line.match(/^\s{2}(\w+):\s*"?([^"]*)"?\s*$/);
    if (inMeta && m) meta[m[1]] = m[2];
  }
  return { metadata: meta };
}

function eventsList() {
  if (!existsSync(EVENTS)) die('contracts event registry not found');
  const types = readdirSync(EVENTS).filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .map((f) => f.replace(/\.(v\d+\.)?json$/, ''));
  console.log('Domain events (contracts registry):');
  for (const t of types) console.log('  •', t);
}

function catalogValidate() {
  const r = spawnSync('node', [join(REPO, 'Backend', 'catalog', 'validate.mjs')], { stdio: 'inherit' });
  process.exit(r.status ?? 0);
}

async function graph() {
  const idxPath = join(REPO, 'Backend', 'catalog', 'index.json');
  if (!existsSync(idxPath)) die('run `baalctl catalog validate` first to generate index.json');
  const idx = JSON.parse(readFileSync(idxPath, 'utf8'));
  for (const [svc, deps] of Object.entries(idx.graph)) {
    console.log(`${svc}${deps.length ? ' → ' + deps.join(', ') : ''}`);
  }
}

const routes = {
  'new:service': newService,
  'catalog:validate': catalogValidate,
  'catalog:list': catalogList,
  'events:list': eventsList,
  'graph:': graph,
  'graph:undefined': graph,
};

const key = `${cmd}:${sub ?? ''}`;
const handler = routes[key] || routes[`${cmd}:undefined`];
if (!handler) {
  console.log('baalctl — Baalvion platform CLI\n');
  console.log('  new service <name> --domain --division --context --owner [--lang]');
  console.log('  catalog validate | catalog list');
  console.log('  events list');
  console.log('  graph');
  process.exit(cmd ? 1 : 0);
}
await handler();
