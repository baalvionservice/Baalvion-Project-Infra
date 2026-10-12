'use strict';
/**
 * Broker filing channel — verification harness.
 *
 * What is proven here:
 *   - an unconfigured broker channel REFUSES (no simulated acknowledgement);
 *   - requests are signed and idempotent, and the signature actually verifies;
 *   - "the broker has it" is never reported as "cleared";
 *   - an unrecognised broker status is NOT turned into a clearance;
 *   - inbound webhooks are rejected when forged, stale or tampered;
 *   - BROKER_COUNTRIES routes a country to the broker without touching the others;
 *   - a real HTTPS round trip works over ordinary verified TLS (local server).
 *
 *   node tests/customs-broker.verify.js
 */
const assert = require('assert');
const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const config = require('../service/customs/connectors/config');
const registry = require('../service/customs/connectors');
const { BrokerConnector, sign, verifyWebhook } = require('../service/customs/connectors/brokerConnector');
const { CHANNEL, STATUS, channelForCountry } = require('../service/customs/schema');

let pass = 0;
let fail = 0;
const failures = [];
async function t(name, fn) {
    try { await fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
const section = (title) => console.log(`\n${title}`);

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'baalvion-broker-'));
const P = (f) => path.join(DIR, f);
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-keyout', P('key.pem'), '-out', P('cert.pem'),
    '-days', '2', '-nodes', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], { stdio: 'ignore' });

const SECRETS = { signingSecret: 'sign-secret-xyz', webhookSecret: 'hook-secret-xyz' };
const baseCfg = (endpoint) => ({
    endpoint, brokerAccountId: 'BAALVION-001', apiKey: 'key-abc', ...SECRETS, caBundlePath: P('cert.pem'),
});

const DECL = {
    entry_type: 'import', origin_country: 'AE', destination_country: 'IN', currency: 'USD',
    incoterm: 'CIF', customs_value: 12000,
    importer: { name: 'Acme Imports', address: 'Mumbai' }, exporter: { name: 'Dubai Trading', address: 'Dubai' },
    line_items: [{ hs_code: '620520', description: 'Cotton shirts', quantity: 100, unit: 'PCS', origin_country: 'AE', unit_value: 120, value: 12000 }],
};

async function main() {
    section('Configuration');
    await t('an unconfigured broker channel refuses and names what is missing', async () => {
        const r = config.resolve(CHANNEL.BROKER, { env: {} });
        assert.strictEqual(r.configured, false);
        const missing = r.missing.map((m) => m.env);
        for (const e of ['BROKER_ENDPOINT', 'BROKER_API_KEY', 'BROKER_SIGNING_SECRET', 'BROKER_WEBHOOK_SECRET', 'BROKER_ACCOUNT_ID']) {
            assert.ok(missing.includes(e), `${e} not reported`);
        }
        const c = new BrokerConnector({ env: {} });
        await assert.rejects(() => c.submit(DECL), (err) => err.name === 'GatewayNotConfiguredError' || /not configured|missing/i.test(err.message));
    });
    await t('readiness lists the broker channel without exposing secrets', () => {
        const rd = config.readiness({ env: { BROKER_API_KEY: 'super-secret-value' } });
        assert.ok(rd.channels.some((c) => c.channel === CHANNEL.BROKER));
        assert.ok(!JSON.stringify(rd).includes('super-secret-value'));
    });
    await t('the registry serves the broker channel', () => {
        assert.ok(registry.supportedChannels().includes(CHANNEL.BROKER));
        assert.ok(registry.getConnectorByChannel(CHANNEL.BROKER) instanceof BrokerConnector);
    });

    section('Country routing');
    await t('BROKER_COUNTRIES sends only the named countries to the broker', () => {
        const prev = process.env.BROKER_COUNTRIES;
        try {
            delete process.env.BROKER_COUNTRIES;
            assert.strictEqual(channelForCountry('IN'), CHANNEL.ICEGATE);
            process.env.BROKER_COUNTRIES = 'in, ae';
            assert.strictEqual(channelForCountry('IN'), CHANNEL.BROKER);
            assert.strictEqual(channelForCountry('ae'), CHANNEL.BROKER);
            assert.strictEqual(channelForCountry('US'), CHANNEL.ACE);
            assert.strictEqual(channelForCountry('ZZ'), null);
        } finally {
            if (prev === undefined) delete process.env.BROKER_COUNTRIES; else process.env.BROKER_COUNTRIES = prev;
        }
    });

    section('Validation');
    await t('refuses a declaration no broker could file', () => {
        const c = new BrokerConnector({});
        const errs = c.validateDeclaration({ line_items: [{ line_no: 1, hs_code: '62' }], importer: {}, exporter: {} });
        const codes = errs.map((e) => e.code);
        assert.deepStrictEqual(codes.sort(), ['BROKER_HS_TOO_SHORT', 'BROKER_MISSING_EXPORTER', 'BROKER_MISSING_IMPORTER']);
    });

    section('Status mapping');
    const parse = (status, extra = {}) => new BrokerConnector({}).parseResponse({ status: 200, body: JSON.stringify({ reference: 'BR-1', status, ...extra }) });
    await t('"filed" and "under review" are submitted, never cleared', () => {
        for (const s of ['received', 'queued', 'filed', 'under_review', 'inspection', 'pending documents']) {
            const r = parse(s);
            assert.strictEqual(r.status, STATUS.SUBMITTED, s);
            assert.strictEqual(r.accepted, false, s);
        }
    });
    await t('only cleared/released are accepted; rejected and cancelled map correctly', () => {
        assert.strictEqual(parse('CLEARED').status, STATUS.ACCEPTED);
        assert.strictEqual(parse('released').accepted, true);
        assert.strictEqual(parse('REJECTED').status, STATUS.REJECTED);
        assert.strictEqual(parse('cancelled').status, STATUS.CANCELLED);
    });
    await t('an unknown broker status is submitted with a warning, not a clearance', () => {
        const r = parse('APPROVED_MAYBE');
        assert.strictEqual(r.status, STATUS.SUBMITTED);
        assert.strictEqual(r.accepted, false);
        assert.ok(r.messages.some((m) => m.code === 'BROKER_UNKNOWN_STATUS'));
    });
    await t('an unparseable response is a transient failure, not a result', () => {
        assert.throws(() => new BrokerConnector({}).parseResponse({ status: 200, body: '<html>oops' }), (e) => e.retryable === true);
    });

    section('Webhook verification');
    const NOW = 1_800_000_000;
    const body = JSON.stringify({ reference: 'BR-1' });
    const good = (ts = NOW, b = body) => ({ 'x-baalvion-timestamp': String(ts), 'x-baalvion-signature': sign(SECRETS.webhookSecret, ts, b) });
    await t('accepts a correctly signed, fresh webhook', () => {
        assert.deepStrictEqual(verifyWebhook(body, good(), SECRETS.webhookSecret, NOW), { ok: true });
    });
    await t('accepts header names in any case', () => {
        const h = good();
        const upper = { 'X-Baalvion-Timestamp': h['x-baalvion-timestamp'], 'X-BAALVION-SIGNATURE': h['x-baalvion-signature'] };
        assert.strictEqual(verifyWebhook(Buffer.from(body), upper, SECRETS.webhookSecret, NOW).ok, true);
    });
    await t('rejects a tampered body', () => {
        assert.strictEqual(verifyWebhook(JSON.stringify({ reference: 'BR-2' }), good(), SECRETS.webhookSecret, NOW).ok, false);
    });
    await t('rejects the wrong secret, missing headers and a stale timestamp', () => {
        assert.strictEqual(verifyWebhook(body, good(), 'other-secret', NOW).ok, false);
        assert.strictEqual(verifyWebhook(body, {}, SECRETS.webhookSecret, NOW).ok, false);
        assert.strictEqual(verifyWebhook(body, good(NOW - 3600), SECRETS.webhookSecret, NOW).ok, false);
        assert.strictEqual(verifyWebhook(body, good(), '', NOW).ok, false);
    });

    section('Real HTTPS round trip (local server, ordinary verified TLS)');
    const seen = [];
    const server = https.createServer({ key: fs.readFileSync(P('key.pem')), cert: fs.readFileSync(P('cert.pem')) }, (req, res) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            seen.push({ method: req.method, url: req.url, headers: req.headers, raw });
            res.setHeader('Content-Type', 'application/json');
            if (req.method === 'POST') return res.end(JSON.stringify({ reference: 'BR-77', status: 'FILED', messages: [{ code: 'OK', level: 'info', text: 'received' }] }));
            return res.end(JSON.stringify({ reference: 'BR-77', status: 'CLEARED' }));
        });
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const url = `https://localhost:${server.address().port}/v1/declarations`;
    try {
        const connector = new BrokerConnector({ config: baseCfg(url), env: {}, backoffMs: 1, sleep: async () => {} });

        await t('submit files, signs the request and reports the broker handle', async () => {
            const out = await connector.submit(DECL, { idempotencyKey: 'idem-123' });
            const r = out.normalized || out.response || out;
            assert.strictEqual((r.gateway_reference || (out.response || {}).gateway_reference), 'BR-77');
            const req = seen.find((s) => s.method === 'POST');
            assert.strictEqual(req.headers.authorization, 'Bearer key-abc');
            assert.strictEqual(req.headers['idempotency-key'], 'idem-123');
            const expect = sign(SECRETS.signingSecret, req.headers['x-baalvion-timestamp'], req.raw);
            assert.strictEqual(req.headers['x-baalvion-signature'], expect, 'signature does not verify');
            const parsed = JSON.parse(req.raw);
            assert.strictEqual(parsed.account_id, 'BAALVION-001');
            assert.strictEqual(parsed.declaration.destination_country, 'IN');
        });
        await t('a FILED answer is submitted, not cleared', async () => {
            const out = await connector.submit(DECL, { idempotencyKey: 'idem-124' });
            const r = out.normalized || out.response || out;
            assert.notStrictEqual(r.status, STATUS.ACCEPTED);
        });
        await t('poll reads the authoritative status from the broker', async () => {
            const r = await connector.poll('BR-77', {});
            assert.strictEqual(r.status, STATUS.ACCEPTED);
            const get = seen.filter((s) => s.method === 'GET').pop();
            assert.ok(get.url.includes('reference=BR-77'));
            assert.ok(get.headers['x-baalvion-signature']);
        });
        await t('a connector pointed at a server with an untrusted certificate refuses', async () => {
            const bad = new BrokerConnector({ config: { ...baseCfg(url), caBundlePath: undefined }, env: {}, maxAttempts: 1, backoffMs: 1, sleep: async () => {} });
            const before = seen.length;
            await assert.rejects(() => bad.submit(DECL, { idempotencyKey: 'idem-125' }), (e) => /certificate|CA bundle|self.signed|verify/i.test(e.message));
            assert.strictEqual(seen.length, before, 'a request reached the server despite failed verification');
        });
    } finally {
        server.close();
    }
}

main()
    .catch((err) => { fail += 1; failures.push({ name: 'harness', message: err.stack || err.message }); })
    .finally(() => {
        fs.rmSync(DIR, { recursive: true, force: true });
        console.log(`\n${pass} passed, ${fail} failed`);
        if (fail) {
            console.log('\nFailures:');
            failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
            process.exit(1);
        }
    });
