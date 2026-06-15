// Live proof that the CANONICAL enableRlsSql() output actually isolates tenants on a
// real Postgres — the policy text every service migration is generated from. Every
// per-service RLS migration is literally this helper's output, so if this passes, those
// migrations are correct by construction (the static audit proves they all USE it).
//
// Self-contained: as the admin/owner it creates a throwaway schema+table, applies the
// helper SQL, grants the runtime role, and seeds two tenants; then as the NON-SUPERUSER
// baalvion_app role it asserts fail-closed isolation, WITH CHECK, and the CR-8 hardening
// (the app role cannot use app.tenant_bypass). Skips when no database/pg is available.
//
// Env: DB_HOST(127.0.0.1) DB_PORT(5432) DB_NAME(baalvion_db)
//      DB_USER(postgres) DB_PASSWORD/PGPASSWORD  — admin/owner (superuser in CI)
//      BAALVION_APP_USER(baalvion_app) BAALVION_APP_PASSWORD — the runtime role
import test from 'node:test';
import assert from 'node:assert/strict';
import { enableRlsSql } from '../index.js';

let pg = null;
try { pg = (await import('pg')).default ?? (await import('pg')); } catch { /* pg not resolvable -> skip */ }

const base = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'baalvion_db',
};
const admin = { ...base, user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres' };
const app = { ...base, user: process.env.BAALVION_APP_USER || 'baalvion_app', password: process.env.BAALVION_APP_PASSWORD || 'baalvion_app_dev_2026' };

const SCHEMA = 'rls_live_probe';
const TABLE = 'things';
const setCtx = (c, tenant, bypass) =>
  c.query("SELECT set_config('app.current_tenant',$1,false), set_config('app.tenant_bypass',$2,false)", [tenant, bypass]);
const countAll = async (c) => Number((await c.query(`SELECT count(*)::int n FROM ${SCHEMA}.${TABLE}`)).rows[0].n);

async function connect(cfg) { const c = new pg.Client(cfg); await c.connect(); return c; }

// Probe whether the environment can run this test at all (DB up + admin can provision).
async function provision() {
  const c = await connect(admin);
  await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
  await c.query(`CREATE SCHEMA ${SCHEMA}`);
  await c.query(`CREATE TABLE ${SCHEMA}.${TABLE} (id bigserial PRIMARY KEY, tenant_id text NOT NULL, label text)`);
  await c.query(`GRANT USAGE ON SCHEMA ${SCHEMA} TO ${app.user}`);
  await c.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${SCHEMA}.${TABLE} TO ${app.user}`);
  await c.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${SCHEMA} TO ${app.user}`);
  // Apply the EXACT canonical policy the per-service migrations are generated from.
  await c.query(enableRlsSql(SCHEMA, TABLE, { tenantColumn: 'tenant_id' }));
  // Seed two tenants as the owner (superuser bypasses RLS), so reads below are the test.
  await c.query(`INSERT INTO ${SCHEMA}.${TABLE} (tenant_id, label) VALUES ('A','a1'),('B','b1')`);
  return c;
}

let adminClient = null;
let skipReason = pg ? null : 'pg module not installed in this context';
if (pg) {
  try { adminClient = await provision(); } catch (e) { skipReason = `cannot provision database: ${e.message}`; }
}

test('canonical enableRlsSql policy isolates tenants live (as baalvion_app)', { skip: skipReason || false }, async (t) => {
  const c = await connect(app);
  try {
    const role = (await c.query('SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user')).rows[0];
    assert.equal(role.rolsuper, false, 'runtime role must NOT be a superuser');
    assert.equal(role.rolbypassrls, false, 'runtime role must NOT have BYPASSRLS');

    await t.test('fail-closed: no tenant set -> 0 rows', async () => {
      await setCtx(c, '', 'off');
      assert.equal(await countAll(c), 0);
    });

    await t.test('tenant A sees only A', async () => {
      await setCtx(c, 'A', 'off');
      const rows = (await c.query(`SELECT tenant_id FROM ${SCHEMA}.${TABLE}`)).rows;
      assert.deepEqual(rows.map((r) => r.tenant_id), ['A']);
    });

    await t.test('tenant B sees only B', async () => {
      await setCtx(c, 'B', 'off');
      const rows = (await c.query(`SELECT tenant_id FROM ${SCHEMA}.${TABLE}`)).rows;
      assert.deepEqual(rows.map((r) => r.tenant_id), ['B']);
    });

    await t.test('WITH CHECK: tenant A cannot insert a B-tenant row', async () => {
      await setCtx(c, 'A', 'off');
      await assert.rejects(
        () => c.query(`INSERT INTO ${SCHEMA}.${TABLE} (tenant_id, label) VALUES ('B','evil')`),
        /row-level security/,
      );
    });

    await t.test('tenant A can insert its own row', async () => {
      await setCtx(c, 'A', 'off');
      await c.query(`INSERT INTO ${SCHEMA}.${TABLE} (tenant_id, label) VALUES ('A','a2')`);
      assert.equal(await countAll(c), 2);
    });

    await t.test('WITH CHECK: tenant A cannot re-tenant a row to B via UPDATE', async () => {
      await setCtx(c, 'A', 'off');
      await assert.rejects(
        () => c.query(`UPDATE ${SCHEMA}.${TABLE} SET tenant_id = 'B' WHERE label = 'a1'`),
        /row-level security/,
      );
    });

    await t.test('CR-8: app role cannot use app.tenant_bypass to read across tenants', async () => {
      await setCtx(c, '', 'on');
      assert.equal(await countAll(c), 0, 'baalvion_app must NOT bypass RLS even with app.tenant_bypass=on');
    });
  } finally {
    await c.end();
  }
});

test.after(async () => {
  if (adminClient) {
    try { await adminClient.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`); } finally { await adminClient.end(); }
  }
});
