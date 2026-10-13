'use strict';
/**
 * Order journey — database-level access proof.
 *
 * This runs the scenarios as a role that is NOT a superuser, because a superuser ignores
 * row-level security and would "pass" everything for the wrong reason. It needs a throwaway
 * Postgres with migration 089 applied:
 *
 *   JOURNEY_TEST_DB=postgres://admin:pw@localhost:5432/scratch node tests/order-journey-db.verify.js
 *
 * What it proves: a party sees only its own journeys; a forwarder or broker cannot hold commercial
 * or payment permission; an invited organisation can only accept or decline; an outsider sees
 * nothing at all; the audit trail cannot be changed; and the journey table carries no price.
 */
const assert = require('assert');
const { Client } = require('pg');

const ADMIN_URL = process.env.JOURNEY_TEST_DB;
if (!ADMIN_URL) { console.log('JOURNEY_TEST_DB not set — database proof skipped.'); process.exit(0); }

let pass = 0;
let fail = 0;
async function t(name, fn) {
    try { await fn(); pass += 1; console.log(`  ✓ ${name}`); } catch (e) { fail += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
}
const rejects = async (fn, pattern, msg) => {
    let err = null;
    try { await fn(); } catch (e) { err = e; }
    assert.ok(err, `${msg || 'expected an error'} — but it succeeded`);
    if (pattern) assert.match(err.message, pattern, `${msg || ''} (got: ${err.message})`);
};

const PROBE = 'journey_probe';
const PROBE_PW = 'probe-pw-for-tests-only';
const u = new URL(ADMIN_URL);
const probeUrl = (() => { const x = new URL(ADMIN_URL); x.username = PROBE; x.password = PROBE_PW; return x.toString(); })();

const BUYER = 'org-buyer'; const SELLER = 'org-seller'; const FWD = 'org-forwarder'; const BROKER = 'org-broker'; const OUTSIDER = 'org-outsider';
const BUYER_PERMS = ['journey.view', 'journey.manage', 'parties.manage', 'logistics.view', 'customs.view', 'documents.view', 'tracking.view', 'commercial.view', 'payment.view'];
const FWD_PERMS = ['journey.view', 'logistics.view', 'logistics.manage', 'customs.view', 'documents.view', 'tracking.view'];

(async () => {
    const admin = new Client({ connectionString: ADMIN_URL });
    await admin.connect();
    // A restricted role, exactly as scripts/create-journey-db-role.sql defines it.
    await admin.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='${PROBE}') THEN CREATE ROLE ${PROBE} LOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$`);
    await admin.query(`ALTER ROLE ${PROBE} WITH PASSWORD '${PROBE_PW}'`);
    await admin.query(`GRANT USAGE ON SCHEMA tradeops TO ${PROBE}`);
    await admin.query(`GRANT SELECT, UPDATE ON tradeops.order_journeys TO ${PROBE}`);
    await admin.query(`GRANT SELECT, INSERT, UPDATE ON tradeops.order_parties TO ${PROBE}`);
    await admin.query(`GRANT SELECT, INSERT ON tradeops.order_party_events TO ${PROBE}`);
    await admin.query(`GRANT SELECT ON tradeops.order_party_directory TO ${PROBE}`);
    await admin.query(`GRANT EXECUTE ON FUNCTION tradeops.current_party_org(), tradeops.party_can(uuid,text,text), tradeops.create_journey(uuid,text,text,text,text,text,text,text,text,text,text[]) TO ${PROBE}`);
    await admin.query('TRUNCATE tradeops.order_party_events, tradeops.order_parties, tradeops.order_journeys CASCADE').catch(async () => {
        // The audit table refuses DELETE by design; truncate bypasses row triggers, so this is only a fallback.
    });

    const probe = new Client({ connectionString: probeUrl });
    await probe.connect();

    /** Run `fn` as an organisation, inside a transaction, with the party org set for this transaction only. */
    const as = async (org, fn) => {
        await probe.query('BEGIN');
        try {
            await probe.query("SELECT set_config('app.party_org', $1, true)", [org]);
            const out = await fn(probe);
            await probe.query('COMMIT');
            return out;
        } catch (e) { await probe.query('ROLLBACK'); throw e; }
    };
    const count = async (c, sql, params = []) => Number((await c.query(`SELECT count(*)::int AS n FROM (${sql}) q`, params)).rows[0].n);

    const ORDER = '11111111-1111-4111-8111-111111111111';
    let journey; let fwdParty;

    console.log('\nThe role itself');
    await t('the test role is not a superuser and does not bypass row security', async () => {
        const r = await admin.query("SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname=$1", [PROBE]);
        assert.deepStrictEqual([r.rows[0].rolsuper, r.rows[0].rolbypassrls], [false, false]);
    });

    console.log('\nOpening a journey');
    await t('the buyer opens a journey and is its first party', async () => {
        journey = (await as(BUYER, (c) => c.query("SELECT tradeops.create_journey($1,'GTI-1',$2,'buyer','u1','IN','AE','FOB','Cotton shirts','620520',$3) AS id", [ORDER, BUYER, BUYER_PERMS]))).rows[0].id;
        assert.ok(journey);
        assert.strictEqual(await as(BUYER, (c) => count(c, 'SELECT 1 FROM tradeops.order_journeys')), 1);
    });
    await t('an organisation cannot open a journey in someone else\'s name', async () => {
        await rejects(() => as(OUTSIDER, (c) => c.query("SELECT tradeops.create_journey($1,'GTI-2',$2,'buyer','u','IN','AE','FOB','x','1',$3)", ['22222222-2222-4222-8222-222222222222', BUYER, BUYER_PERMS])), /calling organisation/);
    });
    await t('only a buyer or a seller can open a journey', async () => {
        await rejects(() => as(FWD, (c) => c.query("SELECT tradeops.create_journey($1,'GTI-3',$2,'freight_forwarder','u','IN','AE','FOB','x','1',$3)", ['33333333-3333-4333-8333-333333333333', FWD, FWD_PERMS])), /buyer or its seller/);
    });
    await t('a second journey for the same order is refused', async () => {
        await rejects(() => as(BUYER, (c) => c.query("SELECT tradeops.create_journey($1,'GTI-1b',$2,'buyer','u','IN','AE','FOB','x','1',$3)", [ORDER, BUYER, BUYER_PERMS])), /uq_order_journeys_order|duplicate/);
    });

    console.log('\nOutsiders see nothing');
    await t('an organisation that is not a party sees no journey, no party, no directory entry, no audit row', async () => {
        await as(OUTSIDER, async (c) => {
            for (const tbl of ['order_journeys', 'order_parties', 'order_party_directory', 'order_party_events']) {
                assert.strictEqual(await count(c, `SELECT 1 FROM tradeops.${tbl}`), 0, tbl);
            }
        });
    });
    await t('a connection with no organisation set sees nothing (fails closed)', async () => {
        const n = await count(probe, 'SELECT 1 FROM tradeops.order_journeys');
        assert.strictEqual(n, 0);
    });

    console.log('\nInviting a forwarder');
    await t('the buyer invites a freight forwarder; the forwarder cannot see the journey until it accepts', async () => {
        await as(BUYER, (c) => c.query("INSERT INTO tradeops.order_parties (journey_id, org_id, party_role, status, permissions, added_by_org_id, added_by_user_id) VALUES ($1,$2,'freight_forwarder','invited',$3,$4,'u1')", [journey, FWD, FWD_PERMS, BUYER]));
        await as(FWD, async (c) => {
            assert.strictEqual(await count(c, 'SELECT 1 FROM tradeops.order_journeys'), 0, 'journey before accepting');
            assert.strictEqual(await count(c, 'SELECT 1 FROM tradeops.order_parties'), 1, 'its own invitation');
            fwdParty = (await c.query('SELECT id FROM tradeops.order_parties')).rows[0].id;
        });
    });
    await t('a forwarder can never be given commercial or payment permission, even by the buyer', async () => {
        for (const bad of ['commercial.view', 'payment.view']) {
            await rejects(() => as(BUYER, (c) => c.query("INSERT INTO tradeops.order_parties (journey_id, org_id, party_role, status, permissions, added_by_org_id) VALUES ($1,'org-f2','freight_forwarder','invited',$2,$3)", [journey, [...FWD_PERMS, bad], BUYER])), /no_commercial_for_service_providers/, bad);
        }
    });
    await t('the same holds for a customs broker', async () => {
        await rejects(() => as(BUYER, (c) => c.query("INSERT INTO tradeops.order_parties (journey_id, org_id, party_role, status, permissions, added_by_org_id) VALUES ($1,$2,'customs_broker','invited',$3,$4)", [journey, BROKER, ['journey.view', 'customs.manage', 'payment.view'], BUYER])), /no_commercial_for_service_providers/);
    });
    await t('a permission that does not exist is refused', async () => {
        await rejects(() => as(BUYER, (c) => c.query("INSERT INTO tradeops.order_parties (journey_id, org_id, party_role, status, permissions, added_by_org_id) VALUES ($1,'org-x','bank','invited',$2,$3)", [journey, ['journey.view', 'god.mode'], BUYER])), /chk_order_parties_permissions/);
    });
    await t('an organisation that is not a party cannot add parties', async () => {
        await rejects(() => as(OUTSIDER, (c) => c.query("INSERT INTO tradeops.order_parties (journey_id, org_id, party_role, status, permissions, added_by_org_id) VALUES ($1,'org-z','bank','invited','{journey.view}',$2)", [journey, OUTSIDER])), /row-level security/);
    });

    console.log('\nAn invited organisation can only accept or decline');
    await t('it cannot grant itself more permission while invited', async () => {
        await rejects(() => as(FWD, (c) => c.query("UPDATE tradeops.order_parties SET permissions = $1 WHERE id = $2", [[...FWD_PERMS, 'parties.manage'], fwdParty])), /only accept or decline/);
    });
    await t('it cannot change its own role or organisation', async () => {
        await rejects(() => as(FWD, (c) => c.query("UPDATE tradeops.order_parties SET party_role = 'buyer' WHERE id = $1", [fwdParty])), /cannot be changed/);
    });
    await t('it accepts, and then sees the journey', async () => {
        await as(FWD, (c) => c.query("UPDATE tradeops.order_parties SET status='active', responded_at=now() WHERE id=$1", [fwdParty]));
        await as(FWD, async (c) => assert.strictEqual(await count(c, 'SELECT 1 FROM tradeops.order_journeys'), 1));
    });

    console.log('\nWhat an active forwarder can and cannot do');
    await t('it sees the other parties by role only, through the directory', async () => {
        await as(FWD, async (c) => {
            const rows = (await c.query('SELECT party_role, org_id FROM tradeops.order_party_directory ORDER BY party_role')).rows;
            assert.deepStrictEqual(rows.map((r) => r.party_role), ['buyer', 'freight_forwarder']);
        });
    });
    await t('it cannot read the buyer\'s party row (and so not its permissions)', async () => {
        await as(FWD, async (c) => {
            const r = (await c.query('SELECT org_id FROM tradeops.order_parties')).rows;
            assert.deepStrictEqual(r.map((x) => x.org_id), [FWD]);
        });
    });
    await t('it cannot invite anyone', async () => {
        await rejects(() => as(FWD, (c) => c.query("INSERT INTO tradeops.order_parties (journey_id, org_id, party_role, status, permissions, added_by_org_id) VALUES ($1,'org-n','trade_agent','invited','{journey.view}',$2)", [journey, FWD])), /row-level security/);
    });
    await t('it cannot raise its own permissions after accepting either', async () => {
        await rejects(() => as(FWD, (c) => c.query("UPDATE tradeops.order_parties SET permissions = $1 WHERE id = $2", [[...FWD_PERMS, 'parties.manage'], fwdParty])), /only accept or decline/);
    });
    await t('it cannot read the audit trail', async () => {
        await as(FWD, async (c) => assert.strictEqual(await count(c, 'SELECT 1 FROM tradeops.order_party_events'), 0));
    });
    await t('it cannot change the journey', async () => {
        const r = await as(FWD, (c) => c.query("UPDATE tradeops.order_journeys SET commodity = 'tampered' WHERE id = $1", [journey]));
        assert.strictEqual(r.rowCount, 0);
    });

    console.log('\nThe buyer, as manager');
    await t('the buyer sees every party row and the audit trail', async () => {
        await as(BUYER, async (c) => {
            assert.strictEqual(await count(c, 'SELECT 1 FROM tradeops.order_parties'), 2);
            assert.ok(await count(c, 'SELECT 1 FROM tradeops.order_party_events') >= 1);
        });
    });
    await t('the buyer can remove the forwarder, which ends its access at once', async () => {
        await as(BUYER, (c) => c.query("UPDATE tradeops.order_parties SET status='removed', removed_at=now() WHERE id=$1", [fwdParty]));
        await as(FWD, async (c) => assert.strictEqual(await count(c, 'SELECT 1 FROM tradeops.order_journeys'), 0));
    });

    console.log('\nThe audit trail');
    await t('nobody can update or delete an audit row, not even the table owner', async () => {
        await rejects(() => admin.query("UPDATE tradeops.order_party_events SET action='x'"), /append-only/);
        await rejects(() => admin.query('DELETE FROM tradeops.order_party_events'), /append-only/);
    });
    await t('an organisation cannot write an audit row in another organisation\'s name', async () => {
        await rejects(() => as(BUYER, (c) => c.query("INSERT INTO tradeops.order_party_events (journey_id, actor_org_id, action) VALUES ($1,$2,'forged')", [journey, FWD])), /row-level security/);
    });

    console.log('\nNo price on the journey');
    await t('the journey table has no price, amount, value, margin, cost or payment column', async () => {
        const cols = (await admin.query("SELECT column_name FROM information_schema.columns WHERE table_schema='tradeops' AND table_name='order_journeys'")).rows.map((r) => r.column_name);
        const bad = cols.filter((c) => /price|amount|value|margin|cost|payment|fee|total/i.test(c));
        assert.deepStrictEqual(bad, [], `commercial columns found: ${bad}`);
    });

    console.log('\nWhy the role matters');
    await t('a superuser connection ignores all of this (so the platform must not use one)', async () => {
        const su = (await admin.query('SELECT rolsuper FROM pg_roles WHERE rolname = current_user')).rows[0].rolsuper;
        if (!su) return; // the admin URL was not a superuser; nothing to demonstrate
        const n = await count(admin, 'SELECT 1 FROM tradeops.order_parties');
        assert.ok(n >= 2, 'a superuser with no organisation set still reads every row');
    });

    await probe.end();
    await admin.end();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
