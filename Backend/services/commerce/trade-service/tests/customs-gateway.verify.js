'use strict';
/**
 * Customs Gateway Abstraction Layer — standalone verification harness (Prompt 9).
 *
 * jest is broken repo-wide (jest-runtime clearMocksOnScope skew), so this script
 * runs the PURE assertions (vocabulary, normalizers, the four connectors, the base
 * submission pipeline + retry mechanism + response normalization, and the registry)
 * with a tiny built-in runner. No DB, no network — connector retry sleeps are
 * stubbed so it is fully deterministic.
 *
 *   node tests/customs-gateway.verify.js
 */
const assert = require('assert');

const schema = require('../service/customs/schema');
const norm = require('../service/customs/normalize');
const registry = require('../service/customs/connectors');
const { CustomsConnector } = require('../service/customs/connectors/baseConnector');
const { IndiaConnector } = require('../service/customs/connectors/indiaConnector');
const { USConnector } = require('../service/customs/connectors/usConnector');
const { EUConnector } = require('../service/customs/connectors/euConnector');
const { UAEConnector } = require('../service/customs/connectors/uaeConnector');
const { ChinaConnector } = require('../service/customs/connectors/chinaConnector');

const noop = () => Promise.resolve();
// Fast connectors: zero-delay retry backoff so the harness is instant + deterministic.
const india = new IndiaConnector({ sleep: noop });
const us = new USConnector({ sleep: noop });
const eu = new EUConnector({ sleep: noop });
const uae = new UAEConnector({ sleep: noop });
const china = new ChinaConnector({ sleep: noop });

let pass = 0;
let fail = 0;
const failures = [];

async function t(name, fn) {
    try {
        await fn();
        pass += 1;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        fail += 1;
        failures.push({ name, message: err.message });
        console.log(`  ✗ ${name}\n      ${err.message}`);
    }
}
function section(title) { console.log(`\n${title}`); }

// ── Declaration fixtures (valid per jurisdiction). ───────────────────────────
const indiaDecl = (simulate) => ({
    entry_type: 'import', destination_country: 'IN', origin_country: 'CN', incoterm: 'CIF',
    currency: 'INR', customs_value: 250000, reference: 'IN-REF-1',
    importer: { name: 'Acme India Pvt Ltd', iec: 'AAACA1234M', country: 'IN' },
    line_items: [{ hs_code: '85171200', description: 'Smartphones', quantity: 100, unit: 'NOS', unit_value: 2500, origin_country: 'CN' }],
    metadata: simulate ? { simulate } : {},
});
const usDecl = (simulate) => ({
    entry_type: 'import', destination_country: 'US', origin_country: 'DE', incoterm: 'DAP',
    currency: 'USD', customs_value: 50000, reference: 'US-REF-1',
    importer: { name: 'Acme USA Inc', tax_id: '12-3456789', country: 'US' },
    line_items: [{ hs_code: '8471300000', description: 'Laptops', quantity: 20, unit: 'EA', unit_value: 2500, origin_country: 'DE' }],
    metadata: simulate ? { simulate } : {},
});
const euDecl = (simulate) => ({
    entry_type: 'import', destination_country: 'DE', origin_country: 'US', incoterm: 'CIP',
    currency: 'EUR', customs_value: 40000, reference: 'EU-REF-1',
    declarant: { name: 'Acme GmbH', eori: 'DE123456789012345', country: 'DE' },
    importer: { name: 'Acme GmbH', eori: 'DE123456789012345', country: 'DE' },
    line_items: [{ hs_code: '84713000', description: 'Laptops', quantity: 15, unit: 'EA', unit_value: 2500, origin_country: 'US' }],
    metadata: simulate ? { simulate } : {},
});
const uaeDecl = (simulate) => ({
    entry_type: 'import', destination_country: 'AE', origin_country: 'IN', incoterm: 'CFR',
    currency: 'AED', customs_value: 120000, reference: 'AE-REF-1',
    importer: { name: 'Acme Trading LLC', tax_id: 'TRN100200300400', country: 'AE' },
    line_items: [{ hs_code: '610910', description: 'Cotton T-shirts', quantity: 5000, unit: 'PCS', unit_value: 20, origin_country: 'IN' }],
    metadata: simulate ? { simulate } : {},
});
const chinaDecl = (simulate) => ({
    entry_type: 'import', destination_country: 'CN', origin_country: 'DE', incoterm: 'FOB',
    currency: 'CNY', customs_value: 800000, reference: 'CN-REF-1',
    importer: { name: 'Acme Trading (Shanghai) Co Ltd', tax_id: '91310000MA1K3XYZ12', country: 'CN' },
    line_items: [{ hs_code: '8471300000', description: 'Laptops', quantity: 200, unit: 'PCS', unit_value: 2500, origin_country: 'DE' }],
    metadata: simulate ? { simulate } : {},
});

(async () => {
    // ── schema vocabulary ────────────────────────────────────────────────────
    section('schema');
    await t('channelForCountry routes IN/US/AE/CN + EU members', () => {
        assert.strictEqual(schema.channelForCountry('IN'), schema.CHANNEL.ICEGATE);
        assert.strictEqual(schema.channelForCountry('us'), schema.CHANNEL.ACE);
        assert.strictEqual(schema.channelForCountry('AE'), schema.CHANNEL.UAE_MIRSAL);
        assert.strictEqual(schema.channelForCountry('DE'), schema.CHANNEL.EU_CDS);
        assert.strictEqual(schema.channelForCountry('FR'), schema.CHANNEL.EU_CDS);
        assert.strictEqual(schema.channelForCountry('CN'), schema.CHANNEL.CHINA_SINGLE_WINDOW);
    });
    await t('normalizedResponse factory enforces channel + status', () => {
        const r = schema.normalizedResponse({ channel: schema.CHANNEL.ACE, status: schema.STATUS.ACCEPTED, accepted: true, gateway_reference: 'ENT1' });
        assert.strictEqual(r.channel, 'ace');
        assert.strictEqual(r.accepted, true);
        assert.throws(() => schema.normalizedResponse({ channel: 'bogus' }));
        assert.throws(() => schema.normalizedResponse({ channel: schema.CHANNEL.ACE, status: 'nope' }));
    });
    await t('GatewayError classifies retryable kinds', () => {
        assert.strictEqual(schema.gatewayError(schema.FAILURE_KIND.TRANSIENT, 'x').retryable, true);
        assert.strictEqual(schema.gatewayError(schema.FAILURE_KIND.PERMANENT, 'x').retryable, false);
        assert.strictEqual(schema.gatewayError(schema.FAILURE_KIND.VALIDATION, 'x').retryable, false);
    });
    await t('status helpers identify terminal + recoverable', () => {
        assert.strictEqual(schema.isTerminal(schema.STATUS.ACCEPTED), true);
        assert.strictEqual(schema.isTerminal(schema.STATUS.FAILED), false);
        assert.strictEqual(schema.isRecoverable(schema.STATUS.FAILED), true);
    });

    // ── normalize ─────────────────────────────────────────────────────────────
    section('normalize');
    await t('normalizeCountry maps long-form + alpha-3', () => {
        assert.strictEqual(norm.normalizeCountry('India'), 'IN');
        assert.strictEqual(norm.normalizeCountry('usa'), 'US');
        assert.strictEqual(norm.normalizeCountry('ARE'), 'AE');
        assert.strictEqual(norm.normalizeCountry('de'), 'DE');
    });
    await t('normalizeDeclaration derives customs_value from lines when absent', () => {
        const d = norm.normalizeDeclaration({
            destination_country: 'US', origin_country: 'CN',
            line_items: [{ hs_code: '8471', quantity: 2, unit_value: 100 }, { hs_code: '8517', value: 50 }],
        });
        assert.strictEqual(d.customs_value, 250); // 2*100 + 50
        assert.strictEqual(d.line_items[0].line_no, 1);
    });
    await t('baseValidationErrors flags missing essentials', () => {
        const errs = norm.baseValidationErrors(norm.normalizeDeclaration({ entry_type: 'import' }));
        const codes = errs.map((e) => e.code);
        assert.ok(codes.includes('MISSING_DESTINATION'));
        assert.ok(codes.includes('NO_LINE_ITEMS'));
        assert.ok(codes.includes('MISSING_IMPORTER'));
    });
    await t('a complete declaration passes base validation', () => {
        const errs = norm.baseValidationErrors(norm.normalizeDeclaration(indiaDecl()));
        assert.strictEqual(errs.length, 0);
    });

    // ── base interface contract ───────────────────────────────────────────────
    section('base interface');
    await t('CustomsConnector is abstract (cannot be instantiated)', () => {
        assert.throws(() => new CustomsConnector({ channel: schema.CHANNEL.ACE }), /abstract/);
    });
    await t('every connector extends CustomsConnector', () => {
        [india, us, eu, uae, china].forEach((c) => assert.ok(c instanceof CustomsConnector));
    });

    // ── connector jurisdiction validation ─────────────────────────────────────
    //
    // Exercised through validate(), not submit(). submit() now refuses before it
    // validates anything when credentials are absent, which is correct — there is
    // no point checking a message we cannot send. validate() exists precisely so
    // a declaration can still be checked during the enrolment period, which is
    // most of an integration's life.
    section('jurisdiction validation');

    const codes = (connector, decl) => connector.validate(decl).map((e) => e.code);

    await t('ICEGATE requires the IEC', () => {
        const d = indiaDecl(); delete d.importer.iec;
        assert.ok(codes(india, d).includes('IN_MISSING_IEC'));
    });
    await t('ICEGATE requires the 8-digit CTSH, not the 6-digit subheading', () => {
        const d = indiaDecl(); d.line_items[0].hs_code = '620520';
        assert.ok(codes(india, d).includes('IN_CTSH_TOO_SHORT'));
    });
    await t('ACE requires an importer of record number', () => {
        const d = usDecl(); delete d.importer.tax_id;
        assert.ok(codes(us, d).includes('US_MISSING_IOR'));
    });
    await t('ACE demands the full ISF element set', () => {
        assert.ok(codes(us, usDecl()).some((c) => c.startsWith('US_ISF_MISSING_')));
    });
    await t('the EU declaration requires an EORI', () => {
        const d = euDecl(); delete d.declarant; delete d.importer.eori; delete d.importer.tax_id;
        assert.ok(codes(eu, d).includes('EU_MISSING_EORI'));
    });
    await t('the EU import declaration requires the 10-digit TARIC code', () => {
        const d = euDecl(); d.line_items[0].hs_code = '84713000';
        assert.ok(codes(eu, d).includes('EU_COMMODITY_CODE_TOO_SHORT'));
    });
    await t('Mirsal requires a declaration type — it decides duty treatment', () => {
        const d = uaeDecl();
        assert.ok(codes(uae, d).includes('AE_MISSING_DECLARATION_TYPE'));
    });
    await t('China requires the trade mode and the 10-digit tariff line', () => {
        const d = chinaDecl(); d.line_items[0].hs_code = '847130';
        const found = codes(china, d);
        assert.ok(found.includes('CN_MISSING_TRADE_MODE'));
        assert.ok(found.includes('CN_HS_TOO_SHORT'));
    });
    await t('validate() works without any credentials at all', () => {
        assert.strictEqual(india.isConfigured(), false);
        assert.doesNotThrow(() => india.validate(indiaDecl()));
    });

    // ── happy-path submission + response normalization ────────────────────────
    // ── the pipeline, exercised with a test double ───────────────────────────
    //
    // These properties used to be tested through a simulator that lived inside
    // the production connectors. That simulator is gone: a fake gateway shipped
    // in the filing path is a standing risk that a real filing silently succeeds
    // against nothing. The pipeline is still worth testing, so the double lives
    // here in the test file, which is where a fake belongs.
    section('submission pipeline (test double)');

    const CFG = { endpoint: 'https://gateway.test/submit', icegateId: 'X', locationCode: 'INNSA1' };

    /** A connector whose transmit() is scripted by the test. */
    class ScriptedConnector extends CustomsConnector {
        constructor(script, opts = {}) {
            super({ channel: schema.CHANNEL.ICEGATE, gatewayName: 'Scripted', sleep: noop, ...opts });
            this.script = script;
            this.attempts = [];
        }

        // Configuration is not what these tests are about.
        // eslint-disable-next-line class-methods-use-this
        assertConfigured() { return CFG; }

        // eslint-disable-next-line class-methods-use-this
        validateDeclaration() { return []; }

        // eslint-disable-next-line class-methods-use-this
        buildPayload(declaration) { return { body: 'payload', declaration }; }

        async transmit(payload, ctx) {
            this.attempts.push(ctx.attempt);
            return this.script(ctx.attempt, this);
        }

        parseResponse(raw) {
            return this.normalize({
                status: raw.status,
                accepted: raw.status === schema.STATUS.ACCEPTED,
                gateway_reference: raw.reference || null,
                gateway_status: raw.native || null,
                messages: raw.messages || [],
                raw,
            });
        }
    }

    const DECL = {
        entry_type: 'import', origin_country: 'CN', destination_country: 'IN',
        currency: 'USD', customs_value: 1000, incoterm: 'CIF',
        importer: { name: 'X', iec: 'ABCDE1234F' },
        line_items: [{ hs_code: '62052000', description: 'Shirts', quantity: 1, unit: 'PCS', origin_country: 'CN', unit_value: 1000 }],
    };

    await t('an accepted response normalizes to accepted with its reference', async () => {
        const c = new ScriptedConnector(() => ({ status: schema.STATUS.ACCEPTED, reference: 'BE-1', native: 'OOC' }));
        const { normalized, attempts } = await c.submit(DECL);
        assert.strictEqual(normalized.accepted, true);
        assert.strictEqual(normalized.gateway_reference, 'BE-1');
        assert.strictEqual(attempts, 1);
    });

    await t('an async acknowledgement is submitted, not accepted', async () => {
        const c = new ScriptedConnector(() => ({ status: schema.STATUS.SUBMITTED, native: 'RECEIVED' }));
        const { normalized } = await c.submit(DECL);
        assert.strictEqual(normalized.status, schema.STATUS.SUBMITTED);
        assert.strictEqual(normalized.accepted, false);
    });

    section('retry mechanism');

    await t('a transient failure is retried and can succeed mid-burst', async () => {
        const c = new ScriptedConnector((attempt, self) => {
            if (attempt < 3) throw self.failTransient('gateway timeout');
            return { status: schema.STATUS.ACCEPTED, reference: 'BE-2', native: 'OOC' };
        });
        const { attempts } = await c.submit(DECL);
        assert.strictEqual(attempts, 3);
        assert.deepStrictEqual(c.attempts, [1, 2, 3]);
    });

    await t('persistent transient failure exhausts the budget then throws transient', async () => {
        const c = new ScriptedConnector((attempt, self) => { throw self.failTransient('always down'); });
        await assert.rejects(() => c.submit(DECL), (err) => err.kind === schema.FAILURE_KIND.TRANSIENT);
        assert.deepStrictEqual(c.attempts, [1, 2, 3]);
    });

    await t('a permanent rejection is never retried', async () => {
        const c = new ScriptedConnector((attempt, self) => { throw self.failPermanent('bad HS code'); });
        await assert.rejects(() => c.submit(DECL), (err) => err.kind === schema.FAILURE_KIND.PERMANENT);
        assert.deepStrictEqual(c.attempts, [1], 'a permanent rejection must cost exactly one attempt');
    });

    await t('a validation failure never reaches the wire at all', async () => {
        class Invalid extends ScriptedConnector {
            // eslint-disable-next-line class-methods-use-this
            validateDeclaration() { return [{ code: 'X', level: 'error', text: 'nope' }]; }
        }
        const c = new Invalid(() => ({ status: schema.STATUS.ACCEPTED }));
        await assert.rejects(() => c.submit(DECL), (err) => err.kind === schema.FAILURE_KIND.VALIDATION);
        assert.deepStrictEqual(c.attempts, [], 'nothing should have been transmitted');
    });

    await t('the retry budget is configurable', async () => {
        const c = new ScriptedConnector((attempt, self) => { throw self.failTransient('down'); }, { maxAttempts: 5 });
        await assert.rejects(() => c.submit(DECL));
        assert.deepStrictEqual(c.attempts, [1, 2, 3, 4, 5]);
    });

    section('registry');

    await t('every channel resolves to a connector', () => {
        for (const channel of Object.values(schema.CHANNEL)) {
            assert.ok(registry.getConnectorByChannel(channel), `no connector for ${channel}`);
        }
    });

    await t('country routing reaches the right gateway', () => {
        assert.strictEqual(registry.getConnectorForCountry('IN').channel, schema.CHANNEL.ICEGATE);
        assert.strictEqual(registry.getConnectorForCountry('US').channel, schema.CHANNEL.ACE);
        assert.strictEqual(registry.getConnectorForCountry('NL').channel, schema.CHANNEL.EU_CDS);
        assert.strictEqual(registry.getConnectorForCountry('AE').channel, schema.CHANNEL.UAE_MIRSAL);
        assert.strictEqual(registry.getConnectorForCountry('CN').channel, schema.CHANNEL.CHINA_SINGLE_WINDOW);
    });

    await t('an unsupported jurisdiction resolves to nothing, not to a default', () => {
        assert.strictEqual(registry.getConnectorForCountry('ZZ'), null);
    });

    await t('every production connector refuses to file without credentials', () => {
        for (const channel of Object.values(schema.CHANNEL)) {
            const c = registry.getConnectorByChannel(channel);
            assert.strictEqual(c.isConfigured(), false, `${channel} claims to be configured in a bare test environment`);
        }
    });

    // ── summary ──────────────────────────────────────────────────────────────
    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
})();
