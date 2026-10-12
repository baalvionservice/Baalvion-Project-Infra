'use strict';
/**
 * Automatic company evidence — verification harness. No network: the registers and the
 * sanctions screen are injected. (service/verification/registries has live smoke
 * checks run by hand; see the PR.)
 *
 *   node tests/company-auto-checks.verify.js
 */
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-only-secret-for-this-verify-script';
const assert = require('assert');
const { runChecks, runAndStore, compareNames, instantTier } = require('../service/verification/companyChecks');
const { splitVat } = require('../service/verification/registries/vies');

let pass = 0;
let fail = 0;
async function t(name, fn) {
    try { await fn(); pass += 1; console.log(`  ✓ ${name}`); } catch (e) { fail += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
}

const entity = (over = {}) => ({
    lei: '254900BLYIXBFFRLUJ90', legal_name: 'Maersk A/S', country: 'DK', jurisdiction: 'DK',
    entity_status: 'ACTIVE', registration_status: 'ISSUED', registered_as: '32345794',
    legal_address: { lines: ['Esplanaden 50'], city: 'Copenhagen', postal_code: '1263', country: 'DK' }, ...over,
});
const clear = async () => ({ decision: 'clear', violation_count: 0, violations: [] });
const deps = (o = {}) => ({
    gleif: {
        searchByRegistration: async () => ({ ok: true, entities: [] }),
        searchByName: async () => ({ ok: true, entities: [] }),
        ...(o.gleif || {}),
    },
    vies: { validate: async () => ({ ok: true, applicable: false }), ...(o.vies || {}) },
    screen: o.screen || clear,
});
const input = { legalName: 'Maersk A/S', registrationNumber: '32345794', country: 'DK' };
const codes = (ev) => ev.summary.signals.map((s) => s.code);

(async () => {
    console.log('Name comparison');
    await t('legal-form and punctuation differences are the same name', () => {
        assert.strictEqual(compareNames('Maersk A/S', 'MAERSK AS'), 'exact');
        assert.strictEqual(compareNames('Acme Trading Pvt Ltd', 'ACME TRADING LIMITED'), 'exact');
    });
    await t('Nordic and other non-decomposing letters match their plain spelling', () => {
        assert.strictEqual(compareNames('A.P. Moller - Maersk A/S', 'A.P. MØLLER - MÆRSK A/S'), 'exact');
        assert.strictEqual(compareNames('Strasse Handels GmbH', 'Straße Handels GmbH'), 'exact');
    });
    await t('one name inside the other is close; unrelated names differ', () => {
        assert.strictEqual(compareNames('Acme Trading', 'Acme Trading International Holdings'), 'close');
        assert.strictEqual(compareNames('Acme Trading', 'Blue Ocean Logistics'), 'different');
        assert.strictEqual(compareNames('', 'Acme'), 'different');
    });

    console.log('\nRegistry evidence');
    await t('a registration number that matches confirms the company', async () => {
        const ev = await runChecks(input, deps({ gleif: { searchByRegistration: async () => ({ ok: true, entities: [entity()] }) } }));
        assert.strictEqual(ev.registry.status, 'found');
        assert.strictEqual(ev.registry.registration_number_match, true);
        assert.ok(codes(ev).includes('REGISTRY_CONFIRMED'));
        assert.strictEqual(ev.summary.outcome, 'supported');
    });
    await t('a number that belongs to a differently named company needs attention', async () => {
        const ev = await runChecks({ ...input, legalName: 'Totally Different Traders' }, deps({ gleif: { searchByRegistration: async () => ({ ok: true, entities: [entity()] }) } }));
        assert.ok(codes(ev).includes('REGISTRY_NAME_MISMATCH'));
        assert.strictEqual(ev.summary.outcome, 'attention');
    });
    await t('an inactive entity needs attention', async () => {
        const ev = await runChecks(input, deps({ gleif: { searchByRegistration: async () => ({ ok: true, entities: [entity({ entity_status: 'INACTIVE' })] }) } }));
        assert.ok(codes(ev).includes('REGISTRY_INACTIVE'));
        assert.strictEqual(ev.summary.outcome, 'attention');
    });
    await t('a name-only hit on an unrelated company is not evidence', async () => {
        const ev = await runChecks({ legalName: 'Sunrise Exports', country: 'IN' }, deps({ gleif: { searchByName: async () => ({ ok: true, entities: [entity({ legal_name: 'Maersk A/S' })] }) } }));
        assert.strictEqual(ev.registry.status, 'not_found');
    });
    await t('not found proves nothing: no attention, no rejection signal', async () => {
        const ev = await runChecks(input, deps());
        assert.ok(codes(ev).includes('REGISTRY_NO_EVIDENCE'));
        assert.strictEqual(ev.summary.outcome, 'no_evidence');
        assert.ok(!ev.summary.signals.some((s) => s.level === 'attention'));
    });
    await t('a register outage is recorded as unavailable and counts neither way', async () => {
        const ev = await runChecks(input, deps({ gleif: { searchByRegistration: async () => ({ ok: false, error: 'timed out' }), searchByName: async () => ({ ok: false, error: 'timed out' }) } }));
        assert.strictEqual(ev.registry.status, 'unavailable');
        assert.ok(codes(ev).includes('REGISTRY_UNAVAILABLE'));
        assert.ok(!ev.summary.signals.some((s) => s.level === 'attention'));
    });

    console.log('\nRegister queries');
    await t('a country typed as a word is not sent as a filter (it would hide real matches)', async () => {
        const gleif = require('../service/verification/registries/gleif');
        const urls = [];
        const orig = global.fetch;
        global.fetch = async (url) => { urls.push(String(url)); return { ok: true, status: 200, text: async () => '{"data":[]}' }; };
        try {
            await gleif.searchByName('Acme Trading', { country: 'India' });
            await gleif.searchByName('Acme Trading', { country: 'in' });
        } finally { global.fetch = orig; }
        assert.ok(!urls[0].includes('legalAddress.country'), urls[0]);
        assert.ok(urls[1].includes('legalAddress.country') && urls[1].includes('=IN'), urls[1]);
    });

    console.log('\nVAT');
    await t('splits EU VAT numbers and ignores non-EU ones', () => {
        assert.deepStrictEqual(splitVat('DE 811-128-135'), { country: 'DE', number: '811128135' });
        assert.deepStrictEqual(splitVat('GR123456789'), { country: 'EL', number: '123456789' });
        assert.strictEqual(splitVat('IN27AAAPL1234C1ZV'), null);
    });
    await t('a valid VAT number is positive evidence', async () => {
        const ev = await runChecks({ legalName: 'X', vatNumber: 'DE811128135' }, deps({ vies: { validate: async () => ({ ok: true, applicable: true, valid: true, vat_number: 'DE811128135' }) } }));
        assert.ok(codes(ev).includes('VAT_VALID'));
        assert.strictEqual(ev.summary.outcome, 'supported');
    });
    await t('an invalid VAT number needs attention; an unavailable VIES does not', async () => {
        const bad = await runChecks({ legalName: 'X', vatNumber: 'DE000' }, deps({ vies: { validate: async () => ({ ok: true, applicable: true, valid: false, vat_number: 'DE000' }) } }));
        assert.ok(codes(bad).includes('VAT_INVALID'));
        const down = await runChecks({ legalName: 'X', vatNumber: 'DE000' }, deps({ vies: { validate: async () => ({ ok: false, applicable: true, error: 'MS_UNAVAILABLE' }) } }));
        assert.ok(codes(down).includes('VAT_UNAVAILABLE'));
        assert.ok(!down.summary.signals.some((s) => s.level === 'attention'));
    });

    console.log('\nSanctions');
    await t('a block or review result needs attention', async () => {
        for (const decision of ['block', 'review']) {
            const ev = await runChecks(input, deps({ screen: async () => ({ decision, violation_count: 1, violations: [{ code: 'X', details: { matched: 'ACME', list_source: 'OFAC', match_quality: 'exact' } }] }) }));
            assert.strictEqual(ev.summary.outcome, 'attention', decision);
            assert.strictEqual(ev.sanctions.matches[0].list, 'OFAC');
        }
    });
    await t('a failed screen is attention, never silently clear', async () => {
        const ev = await runChecks(input, deps({ screen: async () => { throw new Error('db down'); } }));
        assert.strictEqual(ev.sanctions.status, 'unavailable');
        assert.ok(codes(ev).includes('SANCTIONS_NOT_CHECKED'));
        assert.strictEqual(ev.summary.outcome, 'attention');
    });

    console.log('\nInstant tier');
    const supported = { outcome: 'supported' };
    const okS = { status: 'checked', decision: 'clear' };
    await t('is off unless an operator sets a value cap', () => {
        assert.strictEqual(instantTier(supported, okS, {}).eligible, false);
        assert.match(instantTier(supported, okS, {}).reasons[0], /not enabled/);
    });
    await t('when enabled, needs register evidence AND clear sanctions', () => {
        const env = { INSTANT_TIER_MAX_VALUE_USD: '5000' };
        assert.deepStrictEqual(instantTier(supported, okS, env), { eligible: true, max_value_usd: 5000, reasons: [] });
        assert.strictEqual(instantTier({ outcome: 'no_evidence' }, okS, env).eligible, false);
        assert.strictEqual(instantTier({ outcome: 'attention' }, okS, env).eligible, false);
        assert.strictEqual(instantTier(supported, { status: 'checked', decision: 'review' }, env).eligible, false);
        assert.strictEqual(instantTier(supported, { status: 'unavailable' }, env).eligible, false);
    });

    console.log('\nStoring');
    await t('attaches evidence to metadata, keeps existing metadata, never touches status', async () => {
        const rec = { id: 'r1', status: 'submitted', metadata: { country: 'DK', note: 'keep me' }, update: async function (patch) { Object.assign(this, patch); return this; } };
        const ev = await runAndStore(rec, input, deps({ gleif: { searchByRegistration: async () => ({ ok: true, entities: [entity()] }) } }));
        assert.ok(ev && ev.summary);
        assert.strictEqual(rec.metadata.note, 'keep me');
        assert.strictEqual(rec.metadata.auto_checks.summary.outcome, 'supported');
        assert.strictEqual(rec.status, 'submitted');
    });
    await t('a failure while storing is swallowed, not thrown into the submission', async () => {
        const rec = { id: 'r2', metadata: {}, update: async () => { throw new Error('write failed'); } };
        const orig = console.error; console.error = () => {};
        try { assert.strictEqual(await runAndStore(rec, input, deps()), null); } finally { console.error = orig; }
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})();
