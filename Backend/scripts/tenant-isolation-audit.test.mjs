// Unit tests for the tenant-isolation static audit (the CI guard that keeps every
// tenant-scoped table fail-closed). Drives the real CLI against fixture SQL trees so
// the test exercises exactly what CI runs — including the comment-stripping that stops
// a commented-out FORCE/POLICY from masquerading as coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AUDIT = join(dirname(fileURLToPath(import.meta.url)), 'tenant-isolation-audit.mjs');

/** Run the audit over a fixture root; return parsed --json output (exit 1 = findings). */
function runAudit(root) {
  try {
    return JSON.parse(execFileSync('node', [AUDIT, '--json', root], { encoding: 'utf8' }));
  } catch (e) {
    if (e.stdout) return JSON.parse(e.stdout); // non-zero exit on findings still prints JSON
    throw e;
  }
}

/** Build a one-service fixture tree (<root>/services/<name>/migrations/001.sql) and audit it. */
function auditSql(sql, svc = 'probe-svc') {
  const root = mkdtempSync(join(tmpdir(), 'rls-audit-'));
  const dir = join(root, 'services', 'commerce', svc, 'migrations');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, '001_schema.sql'), sql);
  try {
    return runAudit(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const COVERED = (table, schema = 'commerce', col = 'tenant_id') => `
CREATE TABLE ${schema}.${table} (id serial PRIMARY KEY, ${col} text NOT NULL);
ALTER TABLE ${schema}.${table} ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${schema}.${table} FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ${schema}.${table} USING (true);
`;

test('flags a tenant-scoped table with NO RLS', () => {
  const r = auditSql(`CREATE TABLE commerce.widgets (id serial, tenant_id text NOT NULL);`);
  assert.equal(r.findings.length, 1);
  assert.equal(r.findings[0].table, 'widgets');
  assert.deepEqual(r.findings[0].missing, [
    'ENABLE ROW LEVEL SECURITY', 'FORCE ROW LEVEL SECURITY', 'tenant-isolation POLICY',
  ]);
});

test('passes a fully covered table (ENABLE + FORCE + POLICY)', () => {
  const r = auditSql(COVERED('widgets'));
  assert.equal(r.findings.length, 0);
  assert.equal(r.scoped, 1);
});

test('detects org_id and organization_id as tenant columns', () => {
  const r = auditSql(`
    CREATE TABLE commerce.a (id serial, org_id uuid NOT NULL);
    CREATE TABLE commerce.b (id serial, organization_id uuid NOT NULL);
  `);
  assert.equal(r.scoped, 2);
  assert.equal(r.findings.length, 2);
});

test('does NOT scope a table without a tenant column', () => {
  const r = auditSql(`CREATE TABLE commerce.reference (id serial, code text NOT NULL);`);
  assert.equal(r.scoped, 0);
  assert.equal(r.findings.length, 0);
});

test('a COMMENTED-OUT FORCE is NOT counted as coverage (still flagged)', () => {
  const r = auditSql(`
    CREATE TABLE commerce.widgets (id serial, tenant_id text NOT NULL);
    ALTER TABLE commerce.widgets ENABLE ROW LEVEL SECURITY;
    -- ALTER TABLE commerce.widgets FORCE ROW LEVEL SECURITY;   (disabled, must still fail)
    CREATE POLICY tenant_isolation ON commerce.widgets USING (true);
  `);
  assert.equal(r.findings.length, 1);
  assert.deepEqual(r.findings[0].missing, ['FORCE ROW LEVEL SECURITY']);
});

test('a block-commented POLICY is NOT counted as coverage', () => {
  const r = auditSql(`
    CREATE TABLE commerce.widgets (id serial, tenant_id text NOT NULL);
    ALTER TABLE commerce.widgets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE commerce.widgets FORCE ROW LEVEL SECURITY;
    /* CREATE POLICY tenant_isolation ON commerce.widgets USING (true); */
  `);
  assert.equal(r.findings.length, 1);
  assert.deepEqual(r.findings[0].missing, ['tenant-isolation POLICY']);
});

test('a policy with a NON-tenant_isolation name does NOT count as coverage', () => {
  const r = auditSql(`
    CREATE TABLE commerce.widgets (id serial, tenant_id text NOT NULL);
    ALTER TABLE commerce.widgets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE commerce.widgets FORCE ROW LEVEL SECURITY;
    CREATE POLICY allow_all ON commerce.widgets USING (true);
  `);
  assert.equal(r.findings.length, 1);
  assert.deepEqual(r.findings[0].missing, ['tenant-isolation POLICY']);
});

test('a <table>_tenant_isolation policy name DOES count (financial-java convention)', () => {
  const r = auditSql(`
    CREATE TABLE commerce.wallets (id serial, tenant_id text NOT NULL);
    ALTER TABLE commerce.wallets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE commerce.wallets FORCE ROW LEVEL SECURITY;
    CREATE POLICY wallets_tenant_isolation ON commerce.wallets USING (true);
  `);
  assert.equal(r.findings.length, 0);
});

test('a string literal with an escaped quote and -- does not break RLS detection', () => {
  const r = auditSql(`
    CREATE TABLE commerce.widgets (id serial, tenant_id text NOT NULL, note text DEFAULT 'it''s -- not a comment');
    ALTER TABLE commerce.widgets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE commerce.widgets FORCE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation ON commerce.widgets USING (true);
  `);
  assert.equal(r.findings.length, 0, 'RLS after a tricky string literal must still be detected');
});

test('RLS may live in a later migration file than the CREATE TABLE', () => {
  const root = mkdtempSync(join(tmpdir(), 'rls-audit-'));
  const dir = join(root, 'services', 'commerce', 'svc', 'migrations');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, '001_schema.sql'), `CREATE TABLE commerce.widgets (id serial, tenant_id text NOT NULL);`);
  writeFileSync(join(dir, '002_rls.sql'), `
    ALTER TABLE commerce.widgets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE commerce.widgets FORCE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation ON commerce.widgets USING (true);
  `);
  try {
    assert.equal(runAudit(root).findings.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('CLI exits non-zero when findings exist, zero when clean', () => {
  const root = mkdtempSync(join(tmpdir(), 'rls-audit-'));
  const dir = join(root, 'services', 'commerce', 'svc', 'migrations');
  mkdirSync(dir, { recursive: true });
  // clean tree -> exit 0
  writeFileSync(join(dir, '001.sql'), COVERED('widgets'));
  let exit = 0;
  try { execFileSync('node', [AUDIT, root], { encoding: 'utf8' }); } catch (e) { exit = e.status; }
  assert.equal(exit, 0, 'clean tree exits 0');

  // dirty tree -> exit 1
  writeFileSync(join(dir, '002.sql'), `CREATE TABLE commerce.leaky (id serial, tenant_id text);`);
  exit = 0;
  try { execFileSync('node', [AUDIT, root], { encoding: 'utf8' }); } catch (e) { exit = e.status; }
  assert.equal(exit, 1, 'tree with a finding exits 1');

  rmSync(root, { recursive: true, force: true });
});
