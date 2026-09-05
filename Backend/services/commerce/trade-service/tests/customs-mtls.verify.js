'use strict';
/**
 * Mutual-TLS transport + XML — verification harness (real-integration build).
 *
 * These are the security-critical edges of the customs channel. The assertions
 * are mostly about REFUSAL: plain HTTP, an expired client certificate, an
 * unreadable key, a DOCTYPE in a response. Each one is a case where doing the
 * accommodating thing would quietly weaken the channel.
 *
 *   node tests/customs-mtls.verify.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const mtls = require('../service/customs/connectors/mtls');
const xml = require('../service/customs/connectors/xml');
const fw = require('../service/customs/connectors/fixedWidth');

let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'baalvion-mtls-'));
const P = (f) => path.join(DIR, f);
const openssl = (args) => execFileSync('openssl', args, { stdio: 'ignore' });

openssl(['req', '-x509', '-newkey', 'rsa:2048', '-keyout', P('key.pem'), '-out', P('cert.pem'),
    '-days', '365', '-nodes', '-subj', '/CN=live-client']);
openssl(['req', '-x509', '-newkey', 'rsa:2048', '-keyout', P('expired-key.pem'), '-out', P('expired-cert.pem'),
    '-nodes', '-subj', '/CN=expired-client',
    '-not_before', '20240101000000Z', '-not_after', '20250101000000Z']);
fs.writeFileSync(P('empty.pem'), '');

const TLS = { clientCertPath: P('cert.pem'), clientKeyPath: P('key.pem'), caBundlePath: P('cert.pem') };

try {
    // ── credential material ──────────────────────────────────────────────────
    section('TLS material');
    t('a valid credential set builds an agent', () => {
        mtls.resetAgents();
        const { agent, meta } = mtls.getAgent(TLS);
        assert.ok(agent);
        assert.ok(/live-client/.test(meta.subject));
        assert.strictEqual(meta.expired, false);
    });
    t('the agent is cached, not rebuilt per request', () => {
        mtls.resetAgents();
        assert.strictEqual(mtls.getAgent(TLS).agent, mtls.getAgent(TLS).agent);
    });
    t('an EXPIRED client certificate is refused with its expiry date', () => {
        assert.throws(
            () => mtls.getAgent({ clientCertPath: P('expired-cert.pem'), clientKeyPath: P('expired-key.pem'), caBundlePath: P('cert.pem') }),
            (err) => err.name === 'TlsMaterialError' && /expired on 2025-01-01/.test(err.message),
        );
    });
    t('a missing certificate names the path it looked for', () => {
        assert.throws(
            () => mtls.getAgent({ ...TLS, clientCertPath: P('absent.pem') }),
            (err) => err.name === 'TlsMaterialError' && err.message.includes('absent.pem'),
        );
    });
    t('an empty credential file is refused rather than used', () => {
        assert.throws(
            () => mtls.getAgent({ ...TLS, caBundlePath: P('empty.pem') }),
            /is empty/,
        );
    });
    t('certificate metadata exposes the expiry clock', () => {
        const meta = mtls.certificateMeta(fs.readFileSync(P('cert.pem')));
        assert.ok(meta.days_to_expiry > 300);
        assert.ok(meta.fingerprint_sha256);
        assert.ok(meta.valid_to);
    });
    t('an expiring certificate surfaces before the handshake starts failing', () => {
        const status = mtls.certificateStatus({ icegate: { clientCertPath: P('expired-cert.pem') } });
        assert.strictEqual(status[0].certificate.expired, true);
    });

    // ── the refusal that matters most ────────────────────────────────────────
    section('transport refusals');
    t('plain HTTP is refused — a declaration never goes out in clear text', () => {
        assert.throws(
            () => mtls.request({ url: 'http://customs.example/submit', tls: TLS }),
            /https is required/,
        );
    });
    t('server verification is never disabled', () => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'service/customs/connectors/mtls.js'), 'utf8');
        assert.ok(!/rejectUnauthorized:\s*false/.test(src), 'rejectUnauthorized must never be false');
        assert.ok(/rejectUnauthorized: true/.test(src));
        assert.ok(/minVersion: 'TLSv1\.2'/.test(src));
    });

    // ── XML ──────────────────────────────────────────────────────────────────
    section('XML');
    t('markup in a value is escaped, not emitted raw', () => {
        const out = xml.build(xml.el('D', { Ref: 'A&B <script>' }));
        assert.ok(out.includes('A&amp;B &lt;script&gt;'));
        assert.ok(!out.includes('<script>'));
    });
    t('null and undefined values are omitted, never emitted empty', () => {
        const out = xml.build(xml.el('D', { Present: 'x', Absent: null, Undef: undefined }));
        assert.ok(out.includes('<Present>x</Present>'));
        assert.ok(!out.includes('Absent'));
        assert.ok(!out.includes('Undef'));
    });
    t('serialisation is deterministic — a signature over it is reproducible', () => {
        const build = () => xml.build(xml.el('D', { a: '1', b: '2', items: [xml.el('I', { x: '1' })] }));
        assert.strictEqual(build(), build());
    });
    t('DOCTYPE in a response is refused, foreclosing entity expansion', () => {
        assert.throws(
            () => xml.parse('<!DOCTYPE r [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><r>&xxe;</r>'),
            /DOCTYPE is refused/,
        );
    });
    t('mismatched tags are refused rather than silently reinterpreted', () => {
        assert.throws(() => xml.parse('<a><b></a>'), /does not close/);
    });
    t('namespace prefixes do not affect lookup', () => {
        const doc = xml.parse('<ns:R xmlns:ns="urn:x"><ns:Status>RELEASED</ns:Status></ns:R>');
        assert.strictEqual(xml.text(doc, 'status'), 'RELEASED');
    });
    t('CDATA content survives a round trip', () => {
        const doc = xml.parse('<R><Ref><![CDATA[BE<123>&456]]></Ref></R>');
        assert.strictEqual(xml.text(doc, 'Ref'), 'BE<123>&456');
    });
    t('a "]]>" inside CDATA is split so it cannot terminate the section early', () => {
        const out = xml.build(xml.el('R', { children: [{ name: 'X', cdata: 'a]]>b' }] }));
        assert.ok(!/(?<!\]\]\]\])\]\]>b/.test(out.replace('<![CDATA[', '')));
        assert.strictEqual(xml.text(xml.parse(out), 'X'), 'a]]>b');
    });

    // ── fixed width ──────────────────────────────────────────────────────────
    section('fixed-width records');
    const layout = {
        name: 'T',
        recordLength: 30,
        fields: [
            { name: 'id', start: 1, length: 2, type: fw.TYPE.AN, value: '10' },
            { name: 'amount', start: 3, length: 9, type: fw.TYPE.N, decimals: 2 },
            { name: 'text', start: 12, length: 19, type: fw.TYPE.AN },
        ],
    };
    t('a record is exactly the declared width', () => {
        assert.strictEqual(fw.composeRecord(layout, { amount: 1234.5, text: 'x' }).length, 30);
    });
    t('numbers carry implied decimals and round-trip', () => {
        const rec = fw.composeRecord(layout, { amount: 1234.56, text: 'shirts' });
        assert.strictEqual(fw.parseRecord(layout, rec).amount, 1234.56);
    });
    t('a number too wide for its field THROWS — truncation would understate it', () => {
        assert.throws(() => fw.composeRecord(layout, { amount: 99999999.99 }), /understate the declaration/);
    });
    t('text that is too long is truncated, which is only cosmetic', () => {
        const rec = fw.composeRecord(layout, { amount: 1, text: 'a-very-long-description-indeed' });
        assert.strictEqual(rec.length, 30);
    });
    t('a negative amount is refused', () => {
        assert.throws(() => fw.composeRecord(layout, { amount: -1 }), /cannot be negative/);
    });
    t('overlapping fields are refused at layout validation', () => {
        assert.throws(
            () => fw.validateLayout({ name: 'Bad', recordLength: 20, fields: [{ name: 'a', start: 1, length: 10 }, { name: 'b', start: 5, length: 5 }] }),
            /overlaps/,
        );
    });
    t('a field running past the record is refused', () => {
        assert.throws(
            () => fw.validateLayout({ name: 'Over', recordLength: 20, fields: [{ name: 'a', start: 15, length: 10 }] }),
            /past the 20-column record/,
        );
    });

    console.log(`\n${pass} passed, ${fail} failed`);
} finally {
    mtls.resetAgents();
    fs.rmSync(DIR, { recursive: true, force: true });
}

if (fail) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
    process.exit(1);
}
