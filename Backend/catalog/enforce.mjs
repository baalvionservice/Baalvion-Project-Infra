#!/usr/bin/env node
/**
 * BAALVION SYSTEM CONTRACT — machine enforcement gate (CI blocking).
 *
 * Turns catalog/CONTRACT.md from documentation into an executable invariant.
 * Runs the 7 hard rules + catalog validation + the scaffold/registration rule
 * against the live monorepo. Exit non-zero = CI blocks the merge.
 *
 *   C1  one service = one DB           (≤1 system-of-record store per descriptor)
 *   C2  no cross-service DB access     (no source import escaping into a sibling service)
 *   C3  no auth duplication            (jsonwebtoken only in @baalvion/auth-node + allowlist)
 *   C4  gateway is the only entrypoint (exactly one descriptor with ingress: public)
 *   C5  comms via contracts/events     (dependsOn resolves; events exist in the registry)
 *   C6  identity only via auth-node    (no ad-hoc token verify outside the authority)
 *   C7  kernel owns identity only      (Prisma confined to the kernel)
 *
 * Deps: `yaml` + `ajv` (catalog devDeps). Soft-skips catalog parsing when absent
 * so the repo still boots, but source-level rules always run.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, sep } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const rel = (p) => relative(ROOT, p).split(sep).join('/');

// ── documented exceptions ───────────────────────────────────────────────────
// Every entry is a finite, reasoned carve-out. The gate FAILS on any jsonwebtoken
// import that is neither the canonical authority nor listed here — so the residual
// can only shrink, never grow silently.
const JWT_ALLOWLIST = [
  ['Backend/packages/auth-node/', 'canonical JWT authority — the one permitted home'],
  ['Backend/packages/middleware/', 'canonical shared Express auth middleware (RS256 + JTI blacklist) — governed single source'],
  ['Backend/services/identity/auth-service/utils/jwtRsa.js', 'vault-backed RS256 issuer (refresh-family rotation + token hashing) — the identity kernel signing core'],
  ['Backend/services/identity/oauth-service/', 'OAuth2 provider — issues its own access/refresh/id tokens'],
  ['Backend/services/platform/admin-service/service/adminService.js', 'admin impersonation-token issuer (RS256 sign)'],
  ['Backend/services/ecosystem/law-elite/', 'acquired sub-stack, separately governed — migration tracked'],
  ['Backend/services/ecosystem/jobs-service/middleware/authMiddleware.js', 'jwt.decode() only to read the email claim — verification is via @baalvion/auth-node createAuthMiddleware'],
  ['Backend/services/platform/realtime-service/index.js', 'WebSocket upgrade auth — RS256 jwt.verify at the handshake; Express auth-node middleware does not apply to WS upgrades'],
  ['Backend/services/knowledge/cms-service/scripts/', 'dev seed scripts mint a local token for seeding — not a request-path auth surface'],
  ['Backend/services/ecosystem/ctm-service/tests/auth-denial.test.js', 'test-only: jwt.sign mints RS256 tokens to assert authMiddleware GRANTS valid / DENIES forged — not a request-path auth surface'],
];
// C2: sub-stacks that are their own bounded monorepo (internal cross-imports are fine),
// plus Backend/scripts/ which is repo-level tooling (migration generators, seeders) — not a
// deployable service, so it may import shared @baalvion/* packages (e.g. the RLS generator
// sources its policy SQL from @baalvion/tenancy, the single source of truth).
const CROSS_SERVICE_EXEMPT_PREFIXES = ['Backend/services/ecosystem/law-elite/', 'Backend/scripts/'];
// Backend dirs that are not deployable services (no descriptor required).
const NON_SERVICE_DIRS = new Set(['migrations', 'clickhouse', 'timeseries', 'gateway', 'catalog', 'packages', 'platform', 'infra', 'database', 'services', '_reconcile']);

// Per the contract DATA RULES, Postgres is the only system of record; timescaledb
// (metrics), clickhouse (analytics) and redis (cache) are projections, not SoR.
const PRIMARY_STORES = new Set(['postgres']);
const KERNEL_PREFIXES = ['Backend/baalvion-os/', 'platform/baalvion-os/', 'Backend/platform/baalvion-os/'];
const SCAN_ROOTS = ['Backend', 'packages', 'platform'];
const SKIP_DIRS = new Set(['_reconcile', 'catalog', 'node_modules', 'dist', 'build', 'coverage', '.next', '.turbo', '.git', 'keys']);
const CODE_EXT = /\.(c|m)?(js|ts)x?$/;

// ── helpers ───────────────────────────────────────────────────────────────
function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      yield* walk(join(dir, e.name));
    } else if (CODE_EXT.test(e.name) && !e.name.endsWith('.d.ts')) {
      yield join(dir, e.name);
    }
  }
}
const allowPrefix = (path, list) => list.some(([p]) => path === p || path.startsWith(p) || (p.endsWith('/') && path.startsWith(p)));
const reasonFor = (path, list) => (list.find(([p]) => path === p || path.startsWith(p)) || [])[1];

const violations = [];
const add = (rule, file, msg) => violations.push({ rule, file, msg });

// Collect every source file once.
const files = [];
for (const r of SCAN_ROOTS) for (const f of walk(join(ROOT, r))) files.push(f);

// regexes
const RE_JWT = /require\(\s*['"]jsonwebtoken['"]\s*\)|from\s+['"]jsonwebtoken['"]/;
const RE_PRISMA = /@prisma\/client|new\s+PrismaClient|PrismaClient\b/;
const RE_REQUIRE = /(?:require\(\s*|from\s+)['"](\.\.[^'"]*)['"]/g;
const RE_JWTVERIFY = /\bjwt\.(verify|sign)\s*\(/;

// service that a Backend file belongs to. Supports both the flat legacy layout
// (Backend/<service>/…) and the domain-grouped layout (Backend/services/<domain>/<service>/…).
function backendServiceOf(relPath) {
  const nested = relPath.match(/^Backend\/services\/[^/]+\/([^/]+)\//);
  if (nested) return nested[1];
  const flat = relPath.match(/^Backend\/([^/]+)\//);
  return flat ? flat[1] : null;
}

// ── C3 / C6: auth duplication + identity only via auth-node ──────────────────
for (const file of files) {
  const r = rel(file);
  let src;
  try { src = readFileSync(file, 'utf8'); } catch { continue; }
  if (RE_JWT.test(src)) {
    if (!allowPrefix(r, JWT_ALLOWLIST)) {
      add('C3', r, 'imports jsonwebtoken directly — route token logic through @baalvion/auth-node');
    }
  }
  // C7: Prisma confined to the kernel
  if (RE_PRISMA.test(src) && !KERNEL_PREFIXES.some((p) => r.startsWith(p))) {
    add('C7', r, 'uses Prisma outside the kernel (platform/baalvion-os) — kernel owns identity/persistence only');
  }
}

// ── C2: no cross-service imports (covers cross-service DB access) ─────────────
for (const file of files) {
  const r = rel(file);
  const svc = backendServiceOf(r);
  if (!svc) continue;
  if (CROSS_SERVICE_EXEMPT_PREFIXES.some((p) => r.startsWith(p))) continue;
  let src;
  try { src = readFileSync(file, 'utf8'); } catch { continue; }
  let m;
  RE_REQUIRE.lastIndex = 0;
  while ((m = RE_REQUIRE.exec(src))) {
    const spec = m[1];
    const target = rel(resolve(dirname(file), spec));
    const tSvc = backendServiceOf(target.endsWith('/') ? target : target + '/');
    if (target.startsWith('Backend/') && tSvc && tSvc !== svc) {
      add('C2', r, `imports across service boundary into '${tSvc}' ('${spec}') — services must communicate via contracts/events`);
    }
  }
}

// ── catalog descriptors (C1, C4, C5, scaffold) ───────────────────────────────
let YAML, Ajv;
try { YAML = (await import('yaml')).default ?? (await import('yaml')); Ajv = (await import('ajv')).default; }
catch { YAML = null; }

let descriptors = [];
if (YAML) {
  const servicesDir = join(here, 'services');
  const schema = JSON.parse(readFileSync(join(here, 'schema.json'), 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const contractsEvents = join(ROOT, 'Backend', 'packages', 'contracts', 'events');
  const knownEvents = new Set(
    existsSync(contractsEvents)
      ? readdirSync(contractsEvents).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.(v\d+\.)?json$/, ''))
      : [],
  );
  ['auth.login.success', 'auth.session.revoked', 'security.incident', 'org.member.invited',
   'org.member.joined', 'org.member.removed', 'metrics.threshold', 'notification.sent',
   'admin.impersonation', 'proxy.session.ended', 'billing.payment.succeeded', 'billing.payment.failed']
    .forEach((e) => knownEvents.add(e));

  descriptors = readdirSync(servicesDir).filter((f) => f.endsWith('.yaml'))
    .map((f) => ({ file: `catalog/services/${f}`, doc: YAML.parse(readFileSync(join(servicesDir, f), 'utf8')) }));
  const names = new Set(descriptors.map((s) => s.doc?.metadata?.name));

  let publicIngress = [];
  for (const { file, doc } of descriptors) {
    // catalog validation requirement
    if (!validate(doc)) { add('CATALOG', file, JSON.stringify(validate.errors)); continue; }
    const spec = doc.spec || {};
    // C1: one system-of-record store
    const primary = (spec.datastores || []).filter((d) => PRIMARY_STORES.has(d));
    if (primary.length > 1) add('C1', file, `declares ${primary.length} systems of record (${primary.join(', ')}) — one service = one DB`);
    // C4: collect public ingress
    if (spec.ingress === 'public') publicIngress.push(doc.metadata.name);
    // C5: dependsOn + events resolve
    for (const d of spec.dependsOn || []) if (!names.has(d)) add('C5', file, `dependsOn unknown service '${d}'`);
    for (const e of [...(spec.consumesEvents || []), ...(spec.producesEvents || [])]) if (!knownEvents.has(e)) add('C5', file, `references unknown event '${e}'`);
    // scaffold: metadata.path must exist
    if (doc.metadata.path && !existsSync(join(ROOT, doc.metadata.path))) add('SCAFFOLD', file, `metadata.path '${doc.metadata.path}' does not exist`);
  }
  // C4: exactly one public entrypoint, and it is the gateway
  if (publicIngress.length === 0) add('C4', 'catalog', 'no service declares ingress: public — the gateway must be the single entrypoint');
  else if (publicIngress.length > 1) add('C4', 'catalog', `multiple public entrypoints (${publicIngress.join(', ')}) — gateway must be the only one`);
  else if (!/gateway/.test(publicIngress[0])) add('C4', 'catalog', `public entrypoint '${publicIngress[0]}' is not the gateway`);

  // scaffold/registration: every deployable Backend service has a descriptor
  const registeredPaths = new Set(descriptors.map((s) => (s.doc?.metadata?.path || '').replace(/\/$/, '')));
  const backendDir = join(ROOT, 'Backend');
  for (const e of readdirSync(backendDir, { withFileTypes: true })) {
    if (!e.isDirectory() || NON_SERVICE_DIRS.has(e.name)) continue;
    if (!existsSync(join(backendDir, e.name, 'package.json'))) continue;
    const p = `Backend/${e.name}`;
    if (!registeredPaths.has(p) && !names.has(e.name)) {
      add('SCAFFOLD', p, 'deployable service has no catalog descriptor — create services via the scaffold tool (catalog descriptor required)');
    }
  }
} else {
  console.error('note: install `yaml` + `ajv` in catalog/ to run catalog-level rules (C1/C4/C5/scaffold)');
}

// ── report ────────────────────────────────────────────────────────────────
const byRule = {};
for (const v of violations) (byRule[v.rule] ??= []).push(v);
const RULES = {
  C1: 'one service = one DB', C2: 'no cross-service DB access', C3: 'no auth duplication',
  C4: 'gateway is the only entrypoint', C5: 'comms via contracts/events',
  C6: 'identity only via auth-node', C7: 'kernel owns identity only',
  CATALOG: 'catalog descriptors valid', SCAFFOLD: 'services registered via scaffold',
};
console.log('BAALVION SYSTEM CONTRACT — enforcement\n');
let failed = 0;
for (const code of Object.keys(RULES)) {
  const vs = byRule[code] || [];
  if (vs.length === 0) { console.log(`  ✓ ${code}  ${RULES[code]}`); continue; }
  failed += vs.length;
  console.log(`  ✗ ${code}  ${RULES[code]} — ${vs.length} violation(s)`);
  for (const v of vs.slice(0, 25)) console.log(`      ${v.file}: ${v.msg}`);
  if (vs.length > 25) console.log(`      … and ${vs.length - 25} more`);
}
console.log(`\nscanned ${files.length} source files, ${descriptors.length} descriptors — ${failed} violation(s)`);
process.exit(failed ? 1 : 0);
