#!/usr/bin/env node
/**
 * tenant-isolation-audit — static guardrail for multi-tenant RLS coverage.
 *
 * The platform isolates tenants with Postgres Row-Level Security (see
 * @baalvion/tenancy). The failure mode that causes cross-tenant data leaks is a
 * NEW tenant-scoped table that ships WITHOUT `ENABLE` + `FORCE ROW LEVEL
 * SECURITY` and a tenant-isolation policy. This script scans SQL migrations and
 * reports any tenant-scoped table (one with a `tenant_id` / `org_id` column)
 * that is missing one of those three.
 *
 * It is heuristic (it reads SQL text, it does not connect to a DB) so it can run
 * in CI on every PR with zero infra. Exit code 1 on any finding → wire it as a
 * blocking check.
 *
 * Usage:
 *   node Backend/scripts/tenant-isolation-audit.mjs [rootDir ...]
 *   node Backend/scripts/tenant-isolation-audit.mjs --json
 *   node Backend/scripts/tenant-isolation-audit.mjs Backend/services/trade
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const TENANT_COLUMNS = ['tenant_id', 'org_id', 'organization_id'];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);

/** Recursively collect *.sql files under a directory. */
async function collectSql(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) await collectSql(full, out);
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.sql')) {
      out.push(full);
    }
  }
  return out;
}

/** Group migration files by their owning service so RLS can live in a later file. */
function serviceKey(file) {
  const parts = relative(process.cwd(), file).split(sep);
  const idx = parts.findIndex((p) => p === 'services');
  if (idx >= 0 && parts[idx + 2]) return parts.slice(idx, idx + 3).join('/');
  // Fall back to the directory two levels up (…/migrations/file.sql → service dir).
  return parts.slice(0, Math.max(1, parts.length - 2)).join('/');
}

// Tolerates UNLOGGED tables and `)` / `;` separated by whitespace or a newline.
const TABLE_RE =
  /create\s+(?:unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_."]+)\s*\(([\s\S]*?)\)\s*;/gi;
// `ALTER TABLE … ADD COLUMN tenant_id` — a tenant column backfilled after creation.
const ALTER_TENANT_RE = new RegExp(
  `alter\\s+table\\s+(?:if\\s+exists\\s+)?([a-z0-9_."]+)\\s+add\\s+(?:column\\s+)?(?:if\\s+not\\s+exists\\s+)?(?:${TENANT_COLUMNS.join('|')})\\b`,
  'gi',
);
const norm = (t) => t.replace(/"/g, '').split('.').pop().toLowerCase();

/**
 * Find every tenant-scoped table in a service's combined SQL — whether the
 * tenant column was declared inline in CREATE TABLE or added later via ALTER.
 * @returns {Map<string, string>} table name → file it was first defined in
 */
function findTenantTables(combined, fileOf) {
  const scoped = new Map();
  for (const m of combined.matchAll(TABLE_RE)) {
    const name = norm(m[1]);
    const body = m[2].toLowerCase();
    if (TENANT_COLUMNS.some((c) => new RegExp(`\\b${c}\\b`).test(body))) {
      scoped.set(name, fileOf(m.index));
    }
  }
  for (const m of combined.matchAll(ALTER_TENANT_RE)) {
    const name = norm(m[1]);
    if (!scoped.has(name)) scoped.set(name, fileOf(m.index));
  }
  return scoped;
}

/** Within a service's combined SQL, which tables have ENABLE / FORCE / policy. */
function rlsCoverage(sql) {
  const enabled = new Set();
  const forced = new Set();
  const policied = new Set();
  const grab = (re, set) => {
    for (const m of sql.matchAll(re)) set.add(norm(m[1]));
  };
  grab(/alter\s+table\s+(?:if\s+exists\s+)?([a-z0-9_."]+)\s+enable\s+row\s+level\s+security/gi, enabled);
  grab(/alter\s+table\s+(?:if\s+exists\s+)?([a-z0-9_."]+)\s+force\s+row\s+level\s+security/gi, forced);
  grab(/create\s+policy\s+[a-z0-9_."]+\s+on\s+([a-z0-9_."]+)/gi, policied);
  return { enabled, forced, policied };
}

async function audit(roots) {
  const findings = [];
  let scoped = 0;
  let filesScanned = 0;

  for (const root of roots) {
    const files = await collectSql(root);
    const byService = new Map();
    for (const f of files) {
      const key = serviceKey(f);
      if (!byService.has(key)) byService.set(key, []);
      byService.get(key).push(f);
    }

    for (const [service, svcFiles] of byService) {
      filesScanned += svcFiles.length;

      // Concatenate the service's migrations, remembering where each file starts
      // so a matched table can be attributed back to its source file. RLS for a
      // table may live in a later migration than its CREATE — scan the whole set.
      const spans = [];
      let combined = '';
      for (const f of svcFiles) {
        spans.push({ start: combined.length, file: f });
        combined += (await readFile(f, 'utf8')) + '\n';
      }
      const fileOf = (index) => {
        let file = svcFiles[0];
        for (const s of spans) if (index >= s.start) file = s.file;
        return file;
      };

      const cov = rlsCoverage(combined);
      const tenantTables = findTenantTables(combined, fileOf);

      for (const [name, file] of tenantTables) {
        scoped++;
        const missing = [];
        if (!cov.enabled.has(name)) missing.push('ENABLE ROW LEVEL SECURITY');
        if (!cov.forced.has(name)) missing.push('FORCE ROW LEVEL SECURITY');
        if (!cov.policied.has(name)) missing.push('tenant-isolation POLICY');
        if (missing.length) {
          findings.push({ service, table: name, file: relative(process.cwd(), file), missing });
        }
      }
    }
  }
  return { findings, scoped, filesScanned };
}

async function resolveRoots(args) {
  const roots = [];
  for (const a of args) {
    try {
      await stat(a);
      roots.push(a);
    } catch {
      console.error(`! path not found, skipping: ${a}`);
    }
  }
  if (roots.length) return roots;
  // Default: scan the services tree relative to repo root.
  for (const guess of ['Backend/services', 'services', '.']) {
    try {
      await stat(guess);
      return [guess];
    } catch {
      /* keep looking */
    }
  }
  return ['.'];
}

async function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const roots = await resolveRoots(argv.filter((a) => !a.startsWith('--')));

  const { findings, scoped, filesScanned } = await audit(roots);

  if (asJson) {
    console.log(JSON.stringify({ scoped, filesScanned, findings }, null, 2));
  } else {
    console.log(`\n🔐 Tenant-isolation audit`);
    console.log(`   roots:           ${roots.join(', ')}`);
    console.log(`   SQL files:       ${filesScanned}`);
    console.log(`   tenant tables:   ${scoped}`);
    console.log(`   findings:        ${findings.length}\n`);
    for (const f of findings) {
      console.log(`  ✗ ${f.service} → ${f.table}`);
      console.log(`      missing: ${f.missing.join(', ')}`);
      console.log(`      in:      ${f.file}`);
    }
    if (!findings.length) console.log('  ✓ every tenant-scoped table has ENABLE + FORCE RLS + a policy');
    console.log('');
  }

  process.exit(findings.length ? 1 : 0);
}

main().catch((err) => {
  console.error('tenant-isolation-audit failed:', err);
  process.exit(2);
});
