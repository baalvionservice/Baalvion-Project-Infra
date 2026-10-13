'use strict';
/**
 * Order journey — the seven steps and what each party may see of them.
 *
 * Part 1 needs nothing (the step logic is pure). Part 2 needs a throwaway Postgres with migrations
 * 089 and 090 applied and runs as a restricted, non-superuser role so Postgres itself is enforcing:
 *
 *   JOURNEY_TEST_DB=postgres://admin:pw@localhost:5432/scratch node tests/order-journey-steps.verify.js
 */
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-only-secret-for-this-verify-script';
const assert = require('assert');
const crypto = require('crypto');
const { buildSteps, transportBooker } = require('../service/journey/steps');

let pass = 0; let fail = 0;
async function t(name, fn) { try { await fn(); pass += 1; console.log(`  ✓ ${name}`); } catch (e) { fail += 1; console.log(`  ✗ ${name}\n      ${e.message}`); } }
const status = async (fn) => { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } };

const rec = (kind, status, detail = {}, title = kind) => ({ kind, record_id: crypto.randomUUID(), status, title, detail });
const FULL = { role: 'seller', permissions: ['journey.view', 'documents.view', 'logistics.view', 'customs.view', 'tracking.view'], documentScopes: ['commercial_invoice', 'packing_list', 'certificate_of_origin', 'bill_of_lading'] };
const J = { origin_country: 'IN', destination_country: 'AE', incoterm: 'FOB' };
const step = (out, key) => out.steps.find((s) => s.key === key);
const doc = (docType, status = 'available') => rec('document', status, { docType });

(async () => {
    console.log('Step logic (no database)');
    await t('a new order has two steps done and documents as the current step, seller to act', () => {
        const o = buildSteps({ journey: J, records: [], me: FULL });
        assert.strictEqual(o.steps.length, 7);
        assert.strictEqual(o.currentStep, 'documents');
        assert.deepStrictEqual(o.steps.slice(0, 2).map((s) => s.state), ['done', 'done']);
        assert.strictEqual(step(o, 'documents').nextActor.isMyTurn, true);
        assert.deepStrictEqual(o.progress, { done: 2, total: 7 });
    });
    await t('documents finish only when every required type is ready; a cross-border order also needs the origin certificate', () => {
        const some = buildSteps({ journey: J, records: [doc('commercial_invoice'), doc('packing_list')], me: FULL });
        assert.strictEqual(step(some, 'documents').state, 'in_progress');
        assert.deepStrictEqual(step(some, 'documents').missing, ['certificate_of_origin']);
        const all = buildSteps({ journey: J, records: [doc('commercial_invoice'), doc('packing_list'), doc('certificate_of_origin')], me: FULL });
        assert.strictEqual(step(all, 'documents').state, 'done');
        const domestic = buildSteps({ journey: { ...J, destination_country: 'IN' }, records: [doc('commercial_invoice'), doc('packing_list')], me: FULL });
        assert.strictEqual(step(domestic, 'documents').state, 'done');
    });
    await t('a rejected document blocks the step; a document still scanning does not count as ready', () => {
        assert.strictEqual(step(buildSteps({ journey: J, records: [doc('commercial_invoice', 'rejected')], me: FULL }), 'documents').state, 'blocked');
        assert.deepStrictEqual(step(buildSteps({ journey: J, records: [doc('packing_list', 'scanning')], me: FULL }), 'documents').missing.includes('packing_list'), true);
    });
    await t('who books transport follows the Incoterm, and is left open when unknown', () => {
        assert.deepStrictEqual(transportBooker('FOB'), ['buyer']);
        assert.deepStrictEqual(transportBooker('cif'), ['seller']);
        assert.deepStrictEqual(transportBooker('DDP'), ['seller']);
        assert.deepStrictEqual(transportBooker(null), ['seller', 'buyer']);
    });
    await t('customs is not applicable inside one country, and not hard-wired to any country', () => {
        assert.strictEqual(step(buildSteps({ journey: { ...J, destination_country: 'IN' }, records: [], me: FULL }), 'customs').state, 'not_applicable');
        const us = buildSteps({ journey: { origin_country: 'BR', destination_country: 'DE', incoterm: 'CIF' }, records: [rec('customs_filing', 'accepted', { direction: 'export' })], me: FULL });
        assert.strictEqual(step(us, 'customs').state, 'in_progress');
        assert.deepStrictEqual(step(us, 'customs').nextActor.roles, ['buyer']);
    });
    await t('customs needs both ends cleared; a rejected filing blocks; a broker on the order is who acts', () => {
        const both = buildSteps({ journey: J, records: [rec('customs_filing', 'accepted', { direction: 'export' }), rec('customs_filing', 'accepted', { direction: 'import' })], me: FULL });
        assert.strictEqual(step(both, 'customs').state, 'done');
        const bad = buildSteps({ journey: J, records: [rec('customs_filing', 'rejected', { direction: 'export' })], me: FULL, parties: [{ role: 'customs_broker', status: 'active' }] });
        assert.strictEqual(step(bad, 'customs').state, 'blocked');
        assert.deepStrictEqual(step(bad, 'customs').nextActor.roles, ['customs_broker']);
    });
    await t('transit follows the shipment and finishes on arrival; delivery step never claims payment', () => {
        const shipping = buildSteps({ journey: J, records: [rec('shipment', 'in_transit', { actualDeparture: '2026-10-01' })], me: FULL });
        assert.strictEqual(step(shipping, 'in_transit').state, 'in_progress');
        const arrived = buildSteps({ journey: J, records: [rec('shipment', 'delivered', { actualArrival: '2026-10-09' }), rec('proof_of_delivery', 'delivered', { deliveredAt: '2026-10-10' })], me: FULL });
        assert.strictEqual(step(arrived, 'in_transit').state, 'done');
        assert.notStrictEqual(step(arrived, 'delivery_payment').state, 'done');
        assert.strictEqual(arrived.complete, false);
        assert.ok(step(arrived, 'delivery_payment').notes[0].includes('not reported'));
    });
    await t('a party that cannot see all documents is told the view is partial', () => {
        const fwd = { role: 'freight_forwarder', permissions: ['journey.view', 'documents.view'], documentScopes: ['bill_of_lading'] };
        assert.strictEqual(step(buildSteps({ journey: J, records: [], me: fwd }), 'documents').partial, true);
        assert.strictEqual(step(buildSteps({ journey: J, records: [], me: FULL }), 'documents').partial, false);
    });
    await t('the output carries no price fields, whatever is passed in', () => {
        const o = buildSteps({ journey: J, records: [rec('shipment', 'booked', { mode: 'sea' })], me: FULL });
        assert.ok(!/value|price|amount|margin/i.test(JSON.stringify(o).replace(/documents\.view|customs_value/g, '')));
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
        `GRANT EXECUTE ON FUNCTION tradeops.current_party_org(), tradeops.party_can(uuid,text,text), tradeops.create_journey(uuid,text,text,text,text,text,text,text,text,text,text[]), tradeops.journey_records(uuid,text) TO ${PROBE}`,
    ]) await adminSq.query(sql);
    const probeUrl = (() => { const x = new URL(ADMIN_URL); x.username = PROBE; x.password = PROBE_PW; return x.toString(); })();
    const probeSq = new Sequelize(probeUrl, { logging: false });
    dbm.configure({ sequelize: adminSq, restrictedSequelize: probeSq });
    const DIR = {
        'o-fwd': { orgId: 'o-fwd', type: 'logistics_provider', status: 'active' },
        'o-broker': { orgId: 'o-broker', type: 'trade_agent', status: 'active' },
        'o-bank': { orgId: 'o-bank', type: 'bank', status: 'active' },
    };
    orgDirectory.lookup = async (id) => DIR[id] || null;

    console.log('\nWhat each party sees — restricted database role');
    const B = 'o-buyer'; const S = 'o-seller'; const F = 'o-fwd'; const K = 'o-broker'; const BANK = 'o-bank'; const OUT = 'o-outsider';
    const order = crypto.randomUUID();
    const SECRET_VALUE = '987654.32';
    const q = (sql, r) => adminSq.query(sql, { replacements: r });
    let jid; let op; let ship;
    await t('set up: a journey with a forwarder, a broker and a bank, and real records with prices behind them', async () => {
        jid = (await journeys.openJourneyForOrder({ orderId: order, buyerOrgId: B, sellerOrgId: S, originCountry: 'IN', destinationCountry: 'AE', incoterm: 'CIF', commodity: 'Textiles' })).id;
        for (const [org, role] of [[F, 'freight_forwarder'], [K, 'customs_broker'], [BANK, 'bank']]) {
            const p = await parties.inviteParty({ orgId: S, journeyId: jid, role, partyOrgId: org });
            await parties.respondToInvitation({ orgId: org, journeyId: jid, partyId: p.id, accept: true });
        }
        op = crypto.randomUUID(); ship = crypto.randomUUID();
        await q(`INSERT INTO tradeops.trade_operations (id, tenant_id, reference_no, order_id, status, total_value) VALUES (:op, :s, 'TO-1', :o, 'active', ${SECRET_VALUE})`, { op, s: S, o: order });
        await q(`INSERT INTO tradeops.shipments (id, tenant_id, trade_operation_id, shipment_no, status, mode, carrier_name, declared_value, currency, actual_departure) VALUES (:sh, :s, :op, 'SH-1', 'in_transit', 'sea', 'Test Line', ${SECRET_VALUE}, 'USD', now())`, { sh: ship, s: S, op });
        await q(`INSERT INTO tradeops.freight_bookings (tenant_id, order_id, trade_operation_id, shipment_id, status, carrier, mode, amount, currency, quotes) VALUES (:s, :o, :op, :sh, 'confirmed', 'test-line', 'ocean', ${SECRET_VALUE}, 'USD', '[{"price": ${SECRET_VALUE}}]')`, { s: S, o: String(order), op, sh: ship });
        for (const [type, title] of [['commercial_invoice', 'Invoice 1'], ['packing_list', 'Packing 1'], ['bill_of_lading', 'BL 1']]) {
            await q("INSERT INTO tradeops.documents (tenant_id, doc_type, title, status, trade_operation_id) VALUES (:s, :t, :title, 'available', :op)", { s: S, t: type, title, op });
        }
        await q(`INSERT INTO tradeops.customs_submissions (tenant_id, channel, direction, status, trade_operation_id, shipment_id, declaration) VALUES (:s, 'icegate', 'export', 'accepted', :op, :sh, '{"customsValue": ${SECRET_VALUE}}')`, { s: S, op, sh: ship });
        // A record made by an organisation that is NOT a party, pointed at this order: must never appear.
        const fake = crypto.randomUUID();
        await q("INSERT INTO tradeops.trade_operations (id, tenant_id, reference_no, order_id, status) VALUES (:f, :out, 'FAKE', :o, 'active')", { f: fake, out: OUT, o: order });
        await q("INSERT INTO tradeops.documents (tenant_id, doc_type, title, status, trade_operation_id) VALUES (:out, 'packing_list', 'PLANTED', 'available', :f)", { out: OUT, f: fake });
    });
    const view = (org) => journeys.getSteps({ orgId: org, journeyId: jid });
    const kinds = (o) => o.steps.flatMap((s) => s.records.map((r) => r.title));

    await t('the seller sees every step and every record', async () => {
        const o = await view(S);
        assert.ok(kinds(o).includes('Invoice 1') && kinds(o).includes('BL 1') && kinds(o).includes('SH-1'));
        assert.strictEqual(step(o, 'transport_booking').state, 'done');
        assert.strictEqual(step(o, 'customs').state, 'in_progress');
        assert.strictEqual(o.currentStep, 'documents');
    });
    await t('nobody sees a price, in any role: not the value, not the amount, not the quote', async () => {
        for (const org of [B, S, F, K, BANK]) {
            const txt = JSON.stringify(await view(org));
            assert.ok(!txt.includes('987654'), `${org} was shown a price`);
            assert.ok(!/declared|declaration|quotes|total_value|customsValue/i.test(txt), `${org} was shown a price field`);
        }
    });
    await t('the forwarder sees shipment, booking and its own document types, but not the invoice', async () => {
        const o = await view(F);
        assert.ok(kinds(o).includes('SH-1') && kinds(o).includes('test-line') && kinds(o).includes('BL 1') && kinds(o).includes('Packing 1'));
        assert.ok(!kinds(o).includes('Invoice 1'));
        assert.strictEqual(step(o, 'documents').partial, true);
    });
    await t('the bank sees the invoice and bill of lading, but no booking and no customs filing', async () => {
        const o = await view(BANK);
        assert.ok(kinds(o).includes('Invoice 1') && kinds(o).includes('BL 1'));
        assert.ok(!kinds(o).includes('test-line'));
        assert.strictEqual(step(o, 'customs').records.length, 0);
    });
    await t('a record made by a non-party and pointed at this order never appears', async () => {
        for (const org of [B, S, F, K, BANK]) assert.ok(!JSON.stringify(await view(org)).includes('PLANTED') && !JSON.stringify(await view(org)).includes('FAKE'));
    });
    await t('an outsider gets "not found" for the steps', async () => assert.strictEqual(await status(() => view(OUT)), 404));
    await t('Postgres itself returns nothing from journey_records to an outsider, or to a removed party', async () => {
        const raw = (org) => dbm.withOrg(org, (query) => query('SELECT kind FROM tradeops.journey_records(:j, :o)', { j: jid, o: org }));
        assert.strictEqual((await raw(OUT)).length, 0);
        const list = await parties.listParties({ orgId: S, journeyId: jid });
        const fwd = list.find((p) => p.orgId === F);
        await parties.removeParty({ orgId: S, journeyId: jid, partyId: fwd.id });
        assert.strictEqual((await raw(F)).length, 0);
        assert.strictEqual(await status(() => view(F)), 404);
    });
    await t('a caller cannot ask the function for another organisation\'s view', async () => {
        const rows = await dbm.withOrg(OUT, (query) => query('SELECT kind FROM tradeops.journey_records(:j, :o)', { j: jid, o: S }));
        assert.strictEqual(rows.length, 0);
    });
    finish();
})().catch((e) => { console.error(e); process.exit(1); });

function finish() {
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
}
