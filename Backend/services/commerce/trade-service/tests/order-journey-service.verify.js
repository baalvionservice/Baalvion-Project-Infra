'use strict';
/**
 * Order journey — rules and service behaviour.
 *
 * The first half needs nothing. The second half needs a throwaway Postgres with migration 089 applied
 * and runs every scenario TWICE: as a superuser connection (how the platform connects today, so only
 * the application enforces access) and as the restricted role (so Postgres enforces it as well). The
 * answers must be identical.
 *
 *   JOURNEY_TEST_DB=postgres://admin:pw@localhost:5432/scratch node tests/order-journey-service.verify.js
 */
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-only-secret-for-this-verify-script';
const assert = require('assert');
const crypto = require('crypto');
const perms = require('../service/journey/permissions');
const internalAuth = require('../service/journey/internalAuth');

let pass = 0;
let fail = 0;
async function t(name, fn) { try { await fn(); pass += 1; console.log(`  ✓ ${name}`); } catch (e) { fail += 1; console.log(`  ✗ ${name}\n      ${e.message}`); } }
const code = async (fn) => { try { await fn(); return null; } catch (e) { return e.code || e.statusCode || e.message; } };
const status = async (fn) => { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } };

(async () => {
    console.log('Roles and permissions (no database)');
    await t('a forwarder gets sensible defaults and never any commercial or payment permission', () => {
        const g = perms.resolveGrant('freight_forwarder');
        assert.ok(g.permissions.includes('logistics.manage'));
        assert.ok(!g.permissions.includes('commercial.view') && !g.permissions.includes('payment.view'));
        assert.ok(!g.documentScopes.includes('commercial_invoice'));
    });
    await t('asking for a price on a forwarder or broker is refused in plain words', () => {
        for (const role of ['freight_forwarder', 'customs_broker']) {
            for (const p of ['commercial.view', 'payment.view']) {
                assert.throws(() => perms.resolveGrant(role, { permissions: ['journey.view', p] }), /cannot be given|can never see prices/);
            }
        }
    });
    await t('a broker sees customs value only when explicitly granted, and then may hold the invoice', () => {
        assert.ok(!perms.resolveGrant('customs_broker').permissions.includes('customs_value.view'));
        const g = perms.resolveGrant('customs_broker', { permissions: ['journey.view', 'customs.manage', 'customs_value.view'], documentScopes: ['commercial_invoice', 'packing_list'] });
        assert.deepStrictEqual(g.documentScopes, ['commercial_invoice', 'packing_list']);
    });
    await t('a price-bearing document without a value permission is refused', () => {
        assert.throws(() => perms.resolveGrant('customs_broker', { documentScopes: ['commercial_invoice'] }), /explicit value permission/);
        assert.throws(() => perms.resolveGrant('freight_forwarder', { documentScopes: ['letter_of_credit'] }), /explicit value permission/);
    });
    await t('unknown permissions and unknown document types are refused', () => {
        assert.throws(() => perms.resolveGrant('bank', { permissions: ['god.mode'] }), /Unknown permission/);
        assert.throws(() => perms.resolveGrant('bank', { documentScopes: ['secret_memo'] }), /Unknown document type/);
    });
    await t('buyer and seller permissions cannot be customised', () => {
        assert.throws(() => perms.resolveGrant('buyer', { permissions: ['journey.view'] }), /cannot be changed/);
    });
    await t('a role cannot be granted more than its ceiling', () => {
        assert.throws(() => perms.resolveGrant('trade_agent', { permissions: ['journey.view', 'parties.manage'] }), /cannot be given/);
        assert.throws(() => perms.resolveGrant('insurer', { permissions: ['journey.view', 'logistics.manage'] }), /cannot be given/);
    });
    await t('journey.view is always included', () => {
        assert.ok(perms.resolveGrant('bank', { permissions: ['payment.view'] }).permissions.includes('journey.view'));
    });
    await t('the kind of organisation must suit the role', () => {
        assert.throws(() => perms.assertOrgTypeAllowed('freight_forwarder', 'buyer'), /cannot act as a freight forwarder/);
        assert.doesNotThrow(() => perms.assertOrgTypeAllowed('freight_forwarder', 'logistics_provider'));
        assert.doesNotThrow(() => perms.assertOrgTypeAllowed('customs_broker', 'trade_agent'));
        assert.throws(() => perms.assertOrgTypeAllowed('customs_broker', 'customs_authority'), /cannot act as a customs broker/);
    });
    await t('no role or rule mentions a country, so a new corridor needs no change here', () => {
        assert.ok(!/\b(IN|AE|India|UAE|Dubai)\b/.test(JSON.stringify(perms)));
    });

    console.log('\nSigned request from the order service');
    const body = JSON.stringify({ orderId: 'x' });
    const ts = String(Math.floor(Date.now() / 1000));
    const good = { 'x-journey-timestamp': ts, 'x-journey-signature': internalAuth.sign('s3cret', ts, body) };
    await t('a correctly signed, fresh request is accepted', () => assert.strictEqual(internalAuth.verify({ rawBody: body, headers: good, secret: 's3cret' }).ok, true));
    await t('a wrong secret, a tampered body, a stale timestamp and missing headers are all rejected', () => {
        assert.strictEqual(internalAuth.verify({ rawBody: body, headers: good, secret: 'other' }).ok, false);
        assert.strictEqual(internalAuth.verify({ rawBody: body + ' ', headers: good, secret: 's3cret' }).ok, false);
        const old = String(Math.floor(Date.now() / 1000) - 3600);
        assert.strictEqual(internalAuth.verify({ rawBody: body, headers: { 'x-journey-timestamp': old, 'x-journey-signature': internalAuth.sign('s3cret', old, body) }, secret: 's3cret' }).ok, false);
        assert.strictEqual(internalAuth.verify({ rawBody: body, headers: {}, secret: 's3cret' }).ok, false);
    });
    await t('with no secret configured, nothing is accepted (fails closed)', () => {
        assert.strictEqual(internalAuth.verify({ rawBody: body, headers: good, secret: '' }).ok, false);
    });

    const ADMIN_URL = process.env.JOURNEY_TEST_DB;
    if (!ADMIN_URL) { console.log('\n(database scenarios skipped — set JOURNEY_TEST_DB)'); return finish(); }

    const { Sequelize } = require('sequelize');
    const dbm = require('../service/journey/db');
    const journeys = require('../service/journey/journeys');
    const parties = require('../service/journey/parties');
    const orgDirectory = require('../service/journey/orgDirectory');

    const PROBE = 'journey_probe'; const PROBE_PW = 'probe-pw-for-tests-only';
    const adminSq = new Sequelize(ADMIN_URL, { logging: false });
    for (const sql of [
        `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='${PROBE}') THEN CREATE ROLE ${PROBE} LOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$`,
        `ALTER ROLE ${PROBE} WITH PASSWORD '${PROBE_PW}'`,
        `GRANT USAGE ON SCHEMA tradeops TO ${PROBE}`,
        `GRANT SELECT, UPDATE ON tradeops.order_journeys TO ${PROBE}`,
        `GRANT SELECT, INSERT, UPDATE ON tradeops.order_parties TO ${PROBE}`,
        `GRANT SELECT, INSERT ON tradeops.order_party_events TO ${PROBE}`,
        `GRANT SELECT ON tradeops.order_party_directory TO ${PROBE}`,
        `GRANT EXECUTE ON FUNCTION tradeops.current_party_org(), tradeops.party_can(uuid,text,text), tradeops.create_journey(uuid,text,text,text,text,text,text,text,text,text,text[]) TO ${PROBE}`,
    ]) await adminSq.query(sql);
    const probeUrl = (() => { const x = new URL(ADMIN_URL); x.username = PROBE; x.password = PROBE_PW; return x.toString(); })();
    const probeSq = new Sequelize(probeUrl, { logging: false });

    // Organisations the directory knows about.
    const DIR = {
        'org-fwd': { orgId: 'org-fwd', type: 'logistics_provider', status: 'active' },
        'org-broker': { orgId: 'org-broker', type: 'trade_agent', status: 'active' },
        'org-bank': { orgId: 'org-bank', type: 'bank', status: 'active' },
        'org-buyer-2': { orgId: 'org-buyer-2', type: 'buyer', status: 'active' },
        'org-suspended': { orgId: 'org-suspended', type: 'logistics_provider', status: 'suspended' },
    };
    orgDirectory.lookup = async (id) => DIR[id] || null;

    for (const mode of ['application-only', 'database+application']) {
        console.log(`\nScenarios — ${mode}`);
        if (mode === 'application-only') dbm.configure({ sequelize: adminSq, restrictedSequelize: null }); else dbm.configure({ sequelize: adminSq, restrictedSequelize: probeSq });
        const tag = mode === 'application-only' ? 'a' : 'b';
        const BUYER = `org-buyer-${tag}`; const SELLER = `org-seller-${tag}`; const OUT = `org-outsider-${tag}`;
        const order = crypto.randomUUID();
        let jid; let fwd; let broker;

        await t('the status reports the mode truthfully', () => assert.strictEqual(dbm.enforcement(), mode));
        await t('the order service opens a journey with the buyer and seller both active', async () => {
            jid = (await journeys.openJourneyForOrder({ orderId: order, buyerOrgId: BUYER, sellerOrgId: SELLER, originCountry: 'in', destinationCountry: 'AE', incoterm: 'FOB', commodity: 'Cotton shirts', hsCode: '620520' })).id;
            const j = await journeys.getJourney({ orgId: SELLER, journeyId: jid });
            assert.strictEqual(j.origin_country, 'IN');
            assert.deepStrictEqual(j.parties.map((p) => p.role).sort(), ['buyer', 'seller']);
            assert.ok(j.me.permissions.includes('commercial.view'));
        });
        await t('a second journey for the same order is a conflict', async () => assert.strictEqual(await status(() => journeys.openJourneyForOrder({ orderId: order, buyerOrgId: BUYER, sellerOrgId: SELLER })), 409));
        await t('the buyer and seller must be different organisations, and the order must be a UUID', async () => {
            assert.strictEqual(await status(() => journeys.openJourneyForOrder({ orderId: crypto.randomUUID(), buyerOrgId: BUYER, sellerOrgId: BUYER })), 422);
            assert.strictEqual(await status(() => journeys.openJourneyForOrder({ orderId: 'not-a-uuid', buyerOrgId: BUYER, sellerOrgId: SELLER })), 422);
        });
        await t('an outsider gets "not found" for the journey, by id and by order — never "forbidden"', async () => {
            assert.strictEqual(await status(() => journeys.getJourney({ orgId: OUT, journeyId: jid })), 404);
            assert.strictEqual(await status(() => journeys.getJourneyByOrder({ orgId: OUT, orderId: order })), 404);
            assert.strictEqual(await status(() => parties.listParties({ orgId: OUT, journeyId: jid })), 404);
            assert.strictEqual(await status(() => parties.listEvents({ orgId: OUT, journeyId: jid })), 404);
            assert.strictEqual((await journeys.listMyJourneys({ orgId: OUT })).length, 0);
        });

        await t('the buyer invites a forwarder; it sees nothing until it accepts', async () => {
            const r = await parties.inviteParty({ orgId: BUYER, userId: 'u1', journeyId: jid, role: 'freight_forwarder', partyOrgId: 'org-fwd' });
            fwd = r.id;
            assert.strictEqual(r.status, 'invited');
            assert.strictEqual(await status(() => journeys.getJourney({ orgId: 'org-fwd', journeyId: jid })), 404);
        });
        await t('inviting the same organisation in the same role again is a conflict', async () => assert.strictEqual(await status(() => parties.inviteParty({ orgId: BUYER, journeyId: jid, role: 'freight_forwarder', partyOrgId: 'org-fwd' })), 409));
        await t('a forwarder cannot be invited with a price permission, and the message says why', async () => {
            const e = await parties.inviteParty({ orgId: BUYER, journeyId: jid, role: 'freight_forwarder', partyOrgId: 'org-fwd', permissions: ['journey.view', 'payment.view'] }).catch((x) => x);
            assert.strictEqual(e.statusCode, 422);
            assert.match(e.message, /cannot be given|never see prices/);
        });
        await t('the wrong kind of organisation, an unknown one and a suspended one are refused', async () => {
            assert.strictEqual(await status(() => parties.inviteParty({ orgId: BUYER, journeyId: jid, role: 'freight_forwarder', partyOrgId: 'org-buyer-2' })), 422);
            assert.strictEqual(await status(() => parties.inviteParty({ orgId: BUYER, journeyId: jid, role: 'bank', partyOrgId: 'org-nobody' })), 404);
            assert.strictEqual(await status(() => parties.inviteParty({ orgId: BUYER, journeyId: jid, role: 'freight_forwarder', partyOrgId: 'org-suspended' })), 422);
        });
        await t('the buyer and the seller cannot be invited as parties', async () => assert.strictEqual(await status(() => parties.inviteParty({ orgId: BUYER, journeyId: jid, role: 'seller', partyOrgId: 'org-buyer-2' })), 422));
        await t('only the invited organisation can accept, and then it sees the journey without any price', async () => {
            assert.strictEqual(await status(() => parties.respondToInvitation({ orgId: OUT, journeyId: jid, partyId: fwd, accept: true })), 404);
            assert.strictEqual(await status(() => parties.respondToInvitation({ orgId: BUYER, journeyId: jid, partyId: fwd, accept: true })), 404);
            await parties.respondToInvitation({ orgId: 'org-fwd', userId: 'f1', journeyId: jid, partyId: fwd, accept: true });
            const j = await journeys.getJourney({ orgId: 'org-fwd', journeyId: jid });
            assert.strictEqual(j.me.role, 'freight_forwarder');
            assert.ok(!j.me.permissions.includes('commercial.view') && !j.me.permissions.includes('payment.view'));
            const keys = Object.keys(j).join(',');
            assert.ok(!/price|amount|value|margin|cost|payment|total/i.test(keys), `commercial field in ${keys}`);
        });
        await t('an invitation cannot be answered twice', async () => assert.strictEqual(await status(() => parties.respondToInvitation({ orgId: 'org-fwd', journeyId: jid, partyId: fwd, accept: false })), 409));
        await t('the forwarder sees who is on the order by role only, and not their grants', async () => {
            const list = await parties.listParties({ orgId: 'org-fwd', journeyId: jid });
            assert.ok(list.every((p) => !('permissions' in p) && !('documentScopes' in p)));
            assert.deepStrictEqual(list.map((p) => p.role).sort(), ['buyer', 'freight_forwarder', 'seller']);
        });
        await t('the forwarder cannot invite, change grants, remove anyone or read the audit trail', async () => {
            assert.strictEqual(await status(() => parties.inviteParty({ orgId: 'org-fwd', journeyId: jid, role: 'bank', partyOrgId: 'org-bank' })), 403);
            assert.strictEqual(await status(() => parties.updateGrants({ orgId: 'org-fwd', journeyId: jid, partyId: fwd, permissions: ['journey.view', 'logistics.view', 'logistics.manage', 'customs.manage'] })), 403);
            assert.strictEqual(await status(() => parties.removeParty({ orgId: 'org-fwd', journeyId: jid, partyId: fwd })), 403);
            assert.strictEqual(await status(() => parties.listEvents({ orgId: 'org-fwd', journeyId: jid })), 403);
        });
        await t('a customs broker gets customs value only on an explicit grant', async () => {
            broker = (await parties.inviteParty({ orgId: SELLER, journeyId: jid, role: 'customs_broker', partyOrgId: 'org-broker', permissions: ['journey.view', 'customs.manage', 'customs_value.view'], documentScopes: ['commercial_invoice', 'packing_list'] })).id;
            await parties.respondToInvitation({ orgId: 'org-broker', journeyId: jid, partyId: broker, accept: true });
            const j = await journeys.getJourney({ orgId: 'org-broker', journeyId: jid });
            assert.ok(j.me.permissions.includes('customs_value.view') && !j.me.permissions.includes('commercial.view'));
        });
        await t('a partner not yet on the platform is tracked as an external party and gets no access', async () => {
            const ext = await parties.inviteParty({ orgId: SELLER, journeyId: jid, role: 'freight_forwarder', externalName: 'Gulf Partner Freight LLC', externalContact: 'ops@example.test' });
            assert.strictEqual(ext.status, 'active');
            assert.strictEqual(ext.orgId, null);
            const all = await parties.listParties({ orgId: SELLER, journeyId: jid });
            assert.ok(all.some((p) => p.externalName === 'Gulf Partner Freight LLC' && p.orgId === null));
        });
        await t('giving both an organisation and an external name, or neither, is refused', async () => {
            assert.strictEqual(await status(() => parties.inviteParty({ orgId: BUYER, journeyId: jid, role: 'bank', partyOrgId: 'org-bank', externalName: 'x' })), 422);
            assert.strictEqual(await status(() => parties.inviteParty({ orgId: BUYER, journeyId: jid, role: 'bank' })), 422);
        });
        await t('the buyer narrows a forwarder\'s grants, and the change is audited with before and after', async () => {
            await parties.updateGrants({ orgId: BUYER, userId: 'u1', journeyId: jid, partyId: fwd, documentScopes: ['bill_of_lading'] });
            const ev = await parties.listEvents({ orgId: BUYER, journeyId: jid });
            const changed = ev.find((e) => e.action === 'party.grants_changed');
            assert.ok(changed && changed.detail.after.documentScopes.join() === 'bill_of_lading' && changed.detail.before.documentScopes.length > 1);
        });
        await t('the buyer removes the forwarder and its access ends at once; buyer and seller cannot be removed', async () => {
            await parties.removeParty({ orgId: BUYER, userId: 'u1', journeyId: jid, partyId: fwd });
            assert.strictEqual(await status(() => journeys.getJourney({ orgId: 'org-fwd', journeyId: jid })), 404);
            const all = await parties.listParties({ orgId: BUYER, journeyId: jid });
            const sellerRow = all.find((p) => p.role === 'seller');
            assert.strictEqual(await status(() => parties.removeParty({ orgId: BUYER, journeyId: jid, partyId: sellerRow.id })), 409);
        });
        await t('the audit trail lists every change, newest first, with who did it', async () => {
            const ev = await parties.listEvents({ orgId: SELLER, journeyId: jid });
            const actions = ev.map((e) => e.action);
            for (const a of ['journey.opened', 'party.invited', 'party.accepted', 'party.grants_changed', 'party.removed', 'party.tracked']) assert.ok(actions.includes(a), `missing ${a}`);
            assert.ok(ev.every((e) => e.actorOrgId));
        });
        await t('listing my journeys shows the right role for each organisation', async () => {
            assert.strictEqual((await journeys.listMyJourneys({ orgId: SELLER })).find((j) => j.id === jid).myRole, 'seller');
            assert.strictEqual((await journeys.listMyJourneys({ orgId: 'org-broker' })).find((j) => j.id === jid).myRole, 'customs_broker');
        });
    }

    await adminSq.close();
    await probeSq.close();
    finish();
})().catch((e) => { console.error(e); process.exit(1); });

function finish() {
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
}
