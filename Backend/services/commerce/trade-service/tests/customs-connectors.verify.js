'use strict';
/**
 * Government gateway connectors — verification harness (real-integration build).
 *
 * Two things are under test.
 *
 * First, that an unconfigured channel REFUSES. There is no simulator any more,
 * and the most dangerous possible regression would be a connector that quietly
 * returns a plausible acknowledgement for a filing that was never transmitted.
 *
 * Second, that each message is built correctly and each response vocabulary is
 * mapped honestly — in particular that the several gateway states meaning
 * "we have your declaration" are NOT reported as "your cargo is cleared".
 *
 * Test credentials are generated into a temp directory. Nothing here touches
 * real enrolment material, and no test reaches the network.
 *
 *   node tests/customs-connectors.verify.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const config = require('../service/customs/connectors/config');
const registry = require('../service/customs/connectors');
const fw = require('../service/customs/connectors/fixedWidth');
const xml = require('../service/customs/connectors/xml');
const { IndiaConnector, toUqc } = require('../service/customs/connectors/indiaConnector');
const { USConnector, LAYOUTS } = require('../service/customs/connectors/usConnector');
const { EUConnector } = require('../service/customs/connectors/euConnector');
const { UAEConnector } = require('../service/customs/connectors/uaeConnector');
const { ChinaConnector } = require('../service/customs/connectors/chinaConnector');
const { STATUS, FAILURE_KIND } = require('../service/customs/schema');

let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'baalvion-conn-'));
const P = (f) => path.join(DIR, f);
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-keyout', P('key.pem'), '-out', P('cert.pem'),
    '-days', '365', '-nodes', '-subj', '/CN=test-filer'], { stdio: 'ignore' });

// Complete synthetic configuration — enough to exercise message building without
// any real credential.
const TLS = { clientCertPath: P('cert.pem'), clientKeyPath: P('key.pem'), caBundlePath: P('cert.pem') };
const SIGN = { signingCertPath: P('cert.pem'), signingKeyPath: P('key.pem') };
const CFG = {
    icegate: { endpoint: 'https://icegate.test/submit', icegateId: 'ICEG123', locationCode: 'INNSA1', ...TLS, ...SIGN },
    ace: { endpoint: 'https://ace.test/abi', filerCode: 'ABC', senderId: 'SENDER000001', ...TLS },
    eu_cds: { endpoint: 'https://cds.test/decl', memberState: 'DE', eori: 'DE123456789012', ...TLS },
    mirsal: { endpoint: 'https://mirsal.test/decl', businessCode: 'BC001', username: 'u', password: 'p', ...TLS },
    china_single_window: { endpoint: 'https://sw.test/decl', customsCode: 'CN0001', declarantCode: 'D0001', ...TLS, ...SIGN },
};

const DECL = {
    entry_type: 'import',
    origin_country: 'CN',
    destination_country: 'IN',
    currency: 'USD',
    incoterm: 'CIF',
    customs_value: 50000,
    importer: { name: 'Acme Imports', iec: 'ABCDE1234F', tax_id: '27AAAPL1234C1ZV', eori: 'DE123456789012', address: 'Mumbai' },
    exporter: { name: 'Shenzhen Trading', address: 'Shenzhen' },
    line_items: [{
        hs_code: '6205200010', description: 'Mens cotton shirts', quantity: 500,
        unit: 'PCS', origin_country: 'CN', unit_value: 100, value: 50000, net_weight_kg: 250,
    }],
    metadata: {
        port_code: 'INNSA1', invoice_no: 'INV-1', invoice_date: '2026-09-01',
        procedure_code: '4000', declaration_type: '101', total_packages: 20,
        trade_mode: '0110', exemption_nature: '101', transport_mode_code: '2',
        freight_amount: 1200, insurance_amount: 300, bill_of_lading_no: 'BL123',
    },
};

// A US-bound declaration carrying all ten importer-filed ISF elements. The
// connector correctly refuses to build an ISF without them, so the fixture has
// to be complete rather than the validation relaxed.
const US_DECL = () => ({
    ...DECL,
    destination_country: 'US',
    importer: { name: 'Acme Imports Inc', tax_id: '12-3456789', address: 'Newark NJ' },
    metadata: {
        ...DECL.metadata,
        consignee_number: '123456789',
        manufacturer_name: 'Shenzhen Garment Factory',
        manufacturer_country: 'CN',
        ship_to_name: 'Acme DC Newark',
        stuffing_location: 'Shenzhen CFS',
        consolidator_name: 'Pearl River Logistics',
        estimated_lading_date: '2026-09-20',
        port_of_lading: '57035',
        port_of_unlading: '4601',
        port_of_entry: '2704',
    },
});

const buildFor = (Connector, channel, extra = {}, declaration = DECL) => {
    const c = new Connector({ config: CFG[channel], ...extra });
    const cfg = c.assertConfigured();
    const norm = require('../service/customs/normalize').normalizeDeclaration(declaration);
    return { connector: c, payload: c.buildPayload(norm, { cfg, idempotencyKey: 'IDEM-1' }), declaration: norm };
};

try {
    // ── the simulator is gone ────────────────────────────────────────────────
    section('no simulated path exists');
    t('simulate.js has been deleted', () => {
        assert.strictEqual(fs.existsSync(path.join(__dirname, '..', 'service/customs/connectors/simulate.js')), false);
    });
    t('no connector references a simulator', () => {
        const dir = path.join(__dirname, '..', 'service/customs/connectors');
        for (const file of fs.readdirSync(dir)) {
            const src = fs.readFileSync(path.join(dir, file), 'utf8');
            assert.ok(!/_simulate|decideOutcome|deterministicRef/.test(src), `${file} still references the simulator`);
        }
    });

    // ── refusal when unconfigured ────────────────────────────────────────────
    section('an unconfigured channel refuses');
    for (const [channel, Connector] of [
        ['icegate', IndiaConnector], ['ace', USConnector], ['eu_cds', EUConnector],
        ['mirsal', UAEConnector], ['china_single_window', ChinaConnector],
    ]) {
        t(`${channel} refuses with a permanent, non-auto-retryable error`, () => {
            const c = new Connector({ env: {} });
            assert.strictEqual(c.isConfigured(), false);
            let thrown = null;
            try { c.assertConfigured(); } catch (err) { thrown = err; }
            assert.ok(thrown, 'should have thrown');
            assert.strictEqual(thrown.kind, FAILURE_KIND.PERMANENT);
            assert.strictEqual(thrown.retryable, false, 'no backoff conjures a certificate');
            assert.strictEqual(thrown.recoverable, true, 'installing the credential and re-driving must be possible');
            assert.ok(thrown.missing.length > 0);
            assert.ok(/No filing was transmitted/.test(thrown.message));
        });
    }
    t('the refusal names every missing setting and where it comes from', () => {
        let thrown = null;
        try { new IndiaConnector({ env: {} }).assertConfigured(); } catch (err) { thrown = err; }
        const envs = thrown.missing.map((m) => m.env);
        assert.ok(envs.includes('ICEGATE_CLIENT_CERT'));
        assert.ok(envs.includes('ICEGATE_DSC_KEY'));
        assert.ok(thrown.missing.every((m) => m.description));
        assert.ok(thrown.enrolment && thrown.enrolment.length > 20, 'the enrolment path should be stated');
    });
    t('a non-https endpoint is refused', () => {
        const r = config.resolve('icegate', { env: {}, overrides: { ...CFG.icegate, endpoint: 'http://icegate.test/x' } });
        assert.strictEqual(r.configured, false);
        assert.ok(r.missing.some((m) => /https/.test(m.problem)));
    });
    t('a certificate path that does not exist is refused with the path', () => {
        const r = config.resolve('icegate', { env: {}, overrides: { ...CFG.icegate, clientCertPath: '/no/such/cert.pem' } });
        assert.ok(r.missing.some((m) => /file not found/.test(m.problem)));
    });
    t('a fully configured channel reports ready', () => {
        assert.strictEqual(config.resolve('icegate', { env: {}, overrides: CFG.icegate }).configured, true);
    });
    t('readiness separates ready channels from blocked ones', () => {
        const r = config.readiness({ env: {} });
        assert.strictEqual(r.ready_channels.length, 0);
        assert.strictEqual(r.blocked_channels.length, 5);
        assert.ok(/no simulator fallback/i.test(r.note));
    });

    // ── ICEGATE ──────────────────────────────────────────────────────────────
    section('ICEGATE (India)');
    const india = buildFor(IndiaConnector, 'icegate');
    t('builds a signed XML Bill of Entry', () => {
        assert.ok(/^<\?xml/.test(india.payload.body));
        const doc = xml.parse(india.payload.body);
        assert.ok(xml.find(doc, 'BillOfEntry'), 'expected a BillOfEntry block');
        assert.strictEqual(xml.text(doc, 'IEC'), 'ABCDE1234F');
        assert.strictEqual(xml.text(doc, 'LocationCode'), 'INNSA1');
    });
    t('the message carries a detached CMS signature', () => {
        assert.ok(india.payload.headers['X-ICEGATE-Signature']);
        assert.strictEqual(india.payload.headers['X-ICEGATE-Signature-Alg'], 'CMS-SHA256-detached');
        assert.ok(india.payload.meta.signer.subject.includes('test-filer'));
    });
    t('units are mapped to Indian Unit Quantity Codes', () => {
        assert.strictEqual(toUqc('EA'), 'NOS');
        assert.strictEqual(toUqc('kg'), 'KGS');
        assert.strictEqual(toUqc('WIDGETS'), null);
    });
    t('a 6-digit HS code is rejected — India assesses on the 8-digit CTSH', () => {
        const errs = new IndiaConnector({ config: CFG.icegate })
            .validate({ ...DECL, line_items: [{ ...DECL.line_items[0], hs_code: '620520' }] });
        assert.ok(errs.some((e) => e.code === 'IN_CTSH_TOO_SHORT'));
    });
    t('a malformed IEC and GSTIN are both rejected', () => {
        const errs = new IndiaConnector({ config: CFG.icegate })
            .validate({ ...DECL, importer: { name: 'X', iec: 'SHORT', tax_id: 'NOTAGSTIN' } });
        assert.ok(errs.some((e) => e.code === 'IN_BAD_IEC'));
        assert.ok(errs.some((e) => e.code === 'IN_BAD_GSTIN'));
    });
    t('an export shipping bill requires the AD bank code', () => {
        const errs = new IndiaConnector({ config: CFG.icegate })
            .validate({ ...DECL, entry_type: 'export', exporter: DECL.importer, metadata: { ...DECL.metadata, ad_code: null } });
        assert.ok(errs.some((e) => e.code === 'IN_MISSING_AD_CODE'));
    });
    t('ASSESSED is not reported as cleared — only Out Of Charge is', () => {
        const c = new IndiaConnector({ config: CFG.icegate });
        const assessed = c.parseResponse({ status: 200, body: '<Resp><Status>ASSESSED</Status><BeNumber>1234567</BeNumber></Resp>' });
        assert.strictEqual(assessed.accepted, false, 'duty determined is not the same as goods released');
        assert.strictEqual(assessed.status, STATUS.SUBMITTED);
        const ooc = c.parseResponse({ status: 200, body: '<Resp><Status>OOC</Status><BeNumber>1234567</BeNumber></Resp>' });
        assert.strictEqual(ooc.accepted, true);
        assert.strictEqual(ooc.gateway_reference, '1234567');
    });
    t('a customs query is a warning on an open filing, not a rejection', () => {
        const r = new IndiaConnector({ config: CFG.icegate }).parseResponse({
            status: 200,
            body: '<Resp><Status>QUERY</Status><Query><QueryCode>Q1</QueryCode><QueryText>Provide the invoice</QueryText></Query></Resp>',
        });
        assert.strictEqual(r.status, STATUS.SUBMITTED);
        assert.ok(r.messages.some((m) => m.level === 'warning'));
    });
    t('an unparseable response is transient, not a rejected declaration', () => {
        assert.throws(
            () => new IndiaConnector({ config: CFG.icegate }).parseResponse({ status: 200, body: 'not xml at all <<<' }),
            (err) => err.kind === FAILURE_KIND.TRANSIENT,
        );
    });

    // ── ACE ──────────────────────────────────────────────────────────────────
    section('CBP ACE (United States)');
    t('an incomplete ISF refuses to build rather than transmitting a gap', () => {
        // The mandatory-field guard in the record engine is the last line of
        // defence when validation is bypassed.
        const c = new USConnector({ config: CFG.ace });
        assert.throws(
            () => c.buildPayload(require('../service/customs/normalize').normalizeDeclaration(DECL), { cfg: c.assertConfigured() }),
            /required but empty/,
        );
    });
    t('every CATAIR layout is internally consistent', () => {
        for (const layout of Object.values(LAYOUTS)) assert.ok(fw.validateLayout(layout), layout.name);
    });
    t('an ISF builds as fixed-width records of the declared width', () => {
        const us = buildFor(USConnector, 'ace', {}, US_DECL());
        const lines = us.payload.body.split('\n');
        assert.ok(lines.length >= 3);
        for (const line of lines) assert.strictEqual(line.length, 80, `record is ${line.length} chars, expected 80`);
    });
    t('ISF demands all ten importer-filed elements', () => {
        const errs = new USConnector({ config: CFG.ace }).validate({
            ...DECL, destination_country: 'US', metadata: {},
        });
        const codes = errs.map((e) => e.code);
        for (const el of ['MANUFACTURER', 'SHIP_TO', 'CONTAINER_STUFFING_LOCATION', 'CONSOLIDATOR', 'BILL_OF_LADING', 'ESTIMATED_LADING_DATE']) {
            assert.ok(codes.includes(`US_ISF_MISSING_${el}`), `missing element ${el} was not reported`);
        }
    });
    t('the entry summary requires the full 10-digit HTSUS, ISF only 6', () => {
        const six = { ...DECL, destination_country: 'US', line_items: [{ ...DECL.line_items[0], hs_code: '620520' }] };
        const isf = new USConnector({ config: CFG.ace, messageType: 'ISF' }).validate(six);
        const entry = new USConnector({ config: CFG.ace, messageType: 'ENTRY_SUMMARY' }).validate(six);
        assert.ok(!isf.some((e) => e.code === 'US_HTS_TOO_SHORT'));
        assert.ok(entry.some((e) => e.code === 'US_HTS_TOO_SHORT'));
    });
    t('a malformed importer of record number is rejected', () => {
        const errs = new USConnector({ config: CFG.ace })
            .validate({ ...DECL, importer: { name: 'X', tax_id: 'NOT-AN-EIN' } });
        assert.ok(errs.some((e) => e.code === 'US_BAD_IOR'));
    });
    t('test mode is explicit and marks the transmission', () => {
        const cert = buildFor(USConnector, 'ace', { testMode: true }, US_DECL());
        const prod = buildFor(USConnector, 'ace', { testMode: false }, US_DECL());
        assert.strictEqual(cert.payload.headers['X-ABI-Environment'], 'CERT');
        assert.strictEqual(prod.payload.headers['X-ABI-Environment'], 'PROD');
    });
    t('a value too large for its field throws rather than being truncated', () => {
        assert.throws(
            () => fw.composeRecord(LAYOUTS.entryHeader, {
                entryType: '01', portOfEntry: '2704', importerOfRecord: '123456789',
                entryDate: '2026-09-05', countryOfOrigin: 'CN', enteredValue: 99999999999999,
            }),
            /understate the declaration/,
        );
    });
    t('an ISF acceptance is not reported as a cargo release', () => {
        // Record id 60, disposition ACC, then the reference in columns 6-21.
        const record = `60ACC${'ISF0000000000001'.padEnd(16)}20260905`;
        const r = new USConnector({ config: CFG.ace }).parseResponse({ status: 200, body: `${record}\n` });
        assert.strictEqual(r.gateway_status, 'ACC');
        assert.strictEqual(r.gateway_reference, 'ISF0000000000001');
        // ACC means the ISF is on record. Release is a separate ACE message.
        assert.strictEqual(r.status, STATUS.ACCEPTED);
    });
    t('ABI error records are surfaced as messages', () => {
        const disposition = `60REJ${'ISF0000000000001'.padEnd(16)}20260905`;
        const error = `90${'E1234'.padEnd(6)}MISSING MANUFACTURER`;
        const r = new USConnector({ config: CFG.ace }).parseResponse({
            status: 200, body: `${disposition}\n${error}\n`,
        });
        assert.strictEqual(r.status, STATUS.REJECTED);
        assert.ok(r.messages.some((m) => /MANUFACTURER/.test(m.text)));
    });

    // ── EU ───────────────────────────────────────────────────────────────────
    section('EU (member-state UCC system)');
    const eu = buildFor(EUConnector, 'eu_cds');
    t('builds a UCC declaration naming the member state and declarant', () => {
        const doc = xml.parse(eu.payload.body);
        assert.strictEqual(xml.text(doc, 'MemberStateOfDeclaration'), 'DE');
        assert.strictEqual(xml.text(doc, 'TypeCode'), 'H1');
        assert.strictEqual(eu.payload.headers['X-Declarant-EORI'], 'DE123456789012');
    });
    t('import requires the 10-digit TARIC code, export the 8-digit CN code', () => {
        const eight = { ...DECL, line_items: [{ ...DECL.line_items[0], hs_code: '62052000' }] };
        const imp = new EUConnector({ config: CFG.eu_cds }).validate(eight);
        const exp = new EUConnector({ config: CFG.eu_cds }).validate({ ...eight, entry_type: 'export', exporter: DECL.importer });
        assert.ok(imp.some((e) => e.code === 'EU_COMMODITY_CODE_TOO_SHORT'));
        assert.ok(!exp.some((e) => e.code === 'EU_COMMODITY_CODE_TOO_SHORT'));
    });
    t('a malformed EORI is rejected', () => {
        const errs = new EUConnector({ config: CFG.eu_cds })
            .validate({ ...DECL, importer: { name: 'X', eori: 'bad!' } });
        assert.ok(errs.some((e) => e.code === 'EU_BAD_EORI'));
    });
    t('the procedure code is required — it decides the customs treatment', () => {
        const errs = new EUConnector({ config: CFG.eu_cds })
            .validate({ ...DECL, metadata: { ...DECL.metadata, procedure_code: null } });
        assert.ok(errs.some((e) => e.code === 'EU_MISSING_PROCEDURE_CODE'));
    });
    t('UCC "accepted" is not reported as released', () => {
        const c = new EUConnector({ config: CFG.eu_cds });
        const accepted = c.parseResponse({ status: 200, body: '<R><Status>ACCEPTED</Status><MRN>26DE1234567890123</MRN></R>' });
        assert.strictEqual(accepted.accepted, false, 'accepted for processing is not released');
        const released = c.parseResponse({ status: 200, body: '<R><Status>RELEASED</Status><MRN>26DE1234567890123</MRN></R>' });
        assert.strictEqual(released.accepted, true);
        assert.strictEqual(released.gateway_reference, '26DE1234567890123');
    });
    t('signing is applied only when the member state configures it', () => {
        assert.strictEqual(eu.payload.meta.signed, false);
        const signed = buildFor(EUConnector, 'eu_cds');
        const withSigning = new EUConnector({ config: { ...CFG.eu_cds, ...SIGN } });
        const built = withSigning.buildPayload(signed.declaration, { cfg: withSigning.assertConfigured() });
        assert.strictEqual(built.meta.signed, true);
    });

    // ── Mirsal ───────────────────────────────────────────────────────────────
    section('Mirsal 2 (UAE)');
    const ae = buildFor(UAEConnector, 'mirsal');
    t('builds a Mirsal declaration with the business code', () => {
        const doc = xml.parse(ae.payload.body);
        assert.strictEqual(xml.text(doc, 'BusinessCode'), 'BC001');
        assert.strictEqual(xml.text(doc, 'DeclarationType'), '101');
    });
    t('the declaration type is required and validated against the code list', () => {
        const c = new UAEConnector({ config: CFG.mirsal });
        assert.ok(c.validate({ ...DECL, metadata: { ...DECL.metadata, declaration_type: null } })
            .some((e) => e.code === 'AE_MISSING_DECLARATION_TYPE'));
        assert.ok(c.validate({ ...DECL, metadata: { ...DECL.metadata, declaration_type: '999' } })
            .some((e) => e.code === 'AE_BAD_DECLARATION_TYPE'));
    });
    t('the account password never appears in audit metadata', () => {
        assert.ok(!JSON.stringify(ae.payload.meta).includes('"p"'));
        assert.strictEqual(ae.payload.meta.credentials_in_envelope, true);
    });
    t('CLEARED is a release; UNDER_PROCESSING is not', () => {
        const c = new UAEConnector({ config: CFG.mirsal });
        assert.strictEqual(c.parseResponse({ status: 200, body: '<R><Status>UNDER_PROCESSING</Status></R>' }).accepted, false);
        assert.strictEqual(c.parseResponse({ status: 200, body: '<R><Status>CLEARED</Status><DeclarationNumber>DXB-1</DeclarationNumber></R>' }).accepted, true);
    });

    // ── China ────────────────────────────────────────────────────────────────
    section('China Single Window');
    const cn = buildFor(ChinaConnector, 'china_single_window');
    t('builds a signed declaration with the trade mode', () => {
        const doc = xml.parse(cn.payload.body);
        assert.strictEqual(xml.text(doc, 'TradeMode'), '0110');
        assert.strictEqual(xml.text(doc, 'IEFlag'), 'I');
        assert.ok(cn.payload.headers['X-SW-Signature']);
    });
    t('an unsigned filing is refused rather than transmitted unsigned', () => {
        const unsigned = new ChinaConnector({
            config: { ...CFG.china_single_window, signingCertPath: undefined, signingKeyPath: undefined },
            env: {},
        });
        // Signing material is required config, so this fails at the config gate.
        assert.throws(() => unsigned.assertConfigured(), (err) => err.name === 'GatewayNotConfiguredError');
    });
    t('trade mode and exemption nature are required — they select the regime', () => {
        const errs = new ChinaConnector({ config: CFG.china_single_window })
            .validate({ ...DECL, metadata: { ...DECL.metadata, trade_mode: null, exemption_nature: null } });
        assert.ok(errs.some((e) => e.code === 'CN_MISSING_TRADE_MODE'));
        assert.ok(errs.some((e) => e.code === 'CN_MISSING_EXEMPTION_NATURE'));
    });
    t('a 10-digit tariff line is required', () => {
        const errs = new ChinaConnector({ config: CFG.china_single_window })
            .validate({ ...DECL, line_items: [{ ...DECL.line_items[0], hs_code: '62052000' }] });
        assert.ok(errs.some((e) => e.code === 'CN_HS_TOO_SHORT'));
    });

    // ── registry ─────────────────────────────────────────────────────────────
    section('registry');
    t('every channel resolves to a connector that can poll', () => {
        for (const ch of ['icegate', 'ace', 'eu_cds', 'mirsal', 'china_single_window']) {
            const c = registry.getConnectorByChannel(ch);
            assert.ok(c, `no connector for ${ch}`);
            assert.strictEqual(typeof c.poll, 'function', `${ch} cannot poll for an async decision`);
        }
    });
    t('country routing reaches the right gateway', () => {
        assert.strictEqual(registry.getConnectorForCountry('IN').channel, 'icegate');
        assert.strictEqual(registry.getConnectorForCountry('US').channel, 'ace');
        assert.strictEqual(registry.getConnectorForCountry('FR').channel, 'eu_cds');
    });

    console.log(`\n${pass} passed, ${fail} failed`);
} finally {
    fs.rmSync(DIR, { recursive: true, force: true });
}

if (fail) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
    process.exit(1);
}
