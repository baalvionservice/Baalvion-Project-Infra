'use strict';
/**
 * DER + CMS message signing — verification harness (real-integration build).
 *
 * The assertion that actually matters is the OpenSSL one. A hand-built CMS that
 * only this codebase can validate is worthless: the counterparty is a customs
 * authority running someone else's verifier, so the structure is checked against
 * an independent implementation, not against our own parser.
 *
 * Test key material is generated into a temp directory and deleted afterwards.
 * Nothing here touches real DSC material.
 *
 *   node tests/customs-signing.verify.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

const der = require('../service/customs/connectors/der');
const signing = require('../service/customs/connectors/signing');

let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'baalvion-cms-'));
const P = (f) => path.join(DIR, f);
const openssl = (args) => execFileSync('openssl', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

let hasOpenssl = true;
try { openssl(['version']); } catch { hasOpenssl = false; }

// Two independent key pairs: one to sign with, one to prove a mismatched key fails.
openssl(['req', '-x509', '-newkey', 'rsa:2048', '-keyout', P('key.pem'), '-out', P('cert.pem'),
    '-days', '365', '-nodes', '-subj', '/CN=baalvion-filer/O=Baalvion/C=IN']);
openssl(['req', '-x509', '-newkey', 'rsa:2048', '-keyout', P('other-key.pem'), '-out', P('other-cert.pem'),
    '-days', '365', '-nodes', '-subj', '/CN=someone-else']);

const CONTENT = '<?xml version="1.0" encoding="UTF-8"?><Declaration><Ref>BE-2026-0001</Ref></Declaration>';

try {
    // ── DER primitives against known encodings ───────────────────────────────
    section('DER encoding');
    t('signedData OID encodes to the canonical bytes', () => {
        assert.strictEqual(der.oid('1.2.840.113549.1.7.2').toString('hex'), '06092a864886f70d010702');
    });
    t('sha256 OID encodes to the canonical bytes', () => {
        assert.strictEqual(der.oid('2.16.840.1.101.3.4.2.1').toString('hex'), '0609608648016503040201');
    });
    t('INTEGER 128 gains a leading zero so it does not read as negative', () => {
        assert.strictEqual(der.integer(128).toString('hex'), '02020080');
        assert.strictEqual(der.integer(127).toString('hex'), '02017f');
    });
    t('INTEGER 0 is a single zero byte, not empty', () => {
        assert.strictEqual(der.integer(0).toString('hex'), '020100');
    });
    t('lengths use minimal long form above 127', () => {
        assert.strictEqual(der.encodeLength(127).toString('hex'), '7f');
        assert.strictEqual(der.encodeLength(200).toString('hex'), '81c8');
        assert.strictEqual(der.encodeLength(65535).toString('hex'), '82ffff');
    });
    t('SET OF is sorted by encoding, as DER requires', () => {
        const out = der.setOf([Buffer.from([0x02, 0x01, 0x05]), Buffer.from([0x02, 0x01, 0x01])]);
        assert.strictEqual(out.toString('hex'), '3106020101020105');
    });
    t('indefinite length is rejected — it is BER, not DER', () => {
        assert.throws(() => der.readTlv(Buffer.from([0x30, 0x80, 0x00, 0x00])), /indefinite length/);
    });
    t('a truncated value is rejected rather than read past the buffer', () => {
        assert.throws(() => der.readTlv(Buffer.from([0x04, 0x10, 0x01])), /past the buffer/);
    });

    // ── certificate parsing agrees with OpenSSL ──────────────────────────────
    section('certificate parsing');
    t('issuer and serial parse identically to OpenSSL', () => {
        const certDer = execFileSync('openssl', ['x509', '-in', P('cert.pem'), '-outform', 'DER']);
        const { serialNumber, issuerDer } = der.certificateIssuerAndSerial(certDer);
        const expected = openssl(['x509', '-in', P('cert.pem'), '-noout', '-serial']).split('=')[1].trim();
        assert.strictEqual(
            serialNumber.toString('hex').toUpperCase().replace(/^0+/, ''),
            expected.replace(/^0+/, ''),
        );
        assert.strictEqual(issuerDer[0], 0x30, 'issuer must be carried as a raw DER SEQUENCE');
    });

    // ── signed attributes: the encoding that trips everyone up ───────────────
    section('signed attributes');
    t('the signed form is a SET OF and the carried form is [0] IMPLICIT', () => {
        const built = signing.buildSignedAttrs({
            contentDigest: crypto.createHash('sha256').update('x').digest(),
            signingTime: new Date('2026-09-05T00:00:00Z'),
            digestAlg: 'sha256',
        });
        assert.strictEqual(built.forSigning[0], 0x31, 'signed bytes must carry the universal SET tag');
        assert.strictEqual(built.forStructure[0], 0xa0, 'the SignerInfo field must carry [0] IMPLICIT');
        assert.ok(built.forSigning.subarray(1).equals(built.forStructure.subarray(1)),
            'the two forms must differ only in the tag byte');
    });

    // ── the round trip ───────────────────────────────────────────────────────
    section('CMS SignedData');
    const signed = signing.signDetachedCms(CONTENT, { certPath: P('cert.pem'), keyPath: P('key.pem') });
    fs.writeFileSync(P('content.bin'), CONTENT);
    fs.writeFileSync(P('sig.der'), signed.der);

    t('a detached CMS is produced with signer details', () => {
        assert.ok(signed.der.length > 500);
        assert.ok(/baalvion-filer/.test(signed.signer.subject));
        assert.strictEqual(signed.signer.key_type, 'rsa');
    });
    t('our own verifier accepts it', () => {
        const v = signing.verifyDetachedCms(CONTENT, signed.der, fs.readFileSync(P('cert.pem')));
        assert.strictEqual(v.valid, true);
    });
    t('our verifier rejects tampered content', () => {
        const v = signing.verifyDetachedCms(`${CONTENT}<!--tampered-->`, signed.der, fs.readFileSync(P('cert.pem')));
        assert.strictEqual(v.digestMatches, false);
    });
    t('signing with a key that does not match the certificate is refused', () => {
        assert.throws(
            () => signing.signDetachedCms(CONTENT, { certPath: P('cert.pem'), keyPath: P('other-key.pem') }),
            /does not match the public key/,
        );
    });
    t('a missing key file fails with the path, not a stack trace', () => {
        assert.throws(
            () => signing.signDetachedCms(CONTENT, { certPath: P('cert.pem'), keyPath: P('absent.pem') }),
            /signing private key could not be read/,
        );
    });
    t('an unsupported digest is refused', () => {
        assert.throws(
            () => signing.signDetachedCms(CONTENT, { certPath: P('cert.pem'), keyPath: P('key.pem'), digest: 'md5' }),
            /unsupported digest/,
        );
    });
    t('signing is reproducible for a fixed signing time', () => {
        const at = new Date('2026-09-05T12:00:00Z');
        const a = signing.signDetachedCms(CONTENT, { certPath: P('cert.pem'), keyPath: P('key.pem'), signingTime: at });
        const b = signing.signDetachedCms(CONTENT, { certPath: P('cert.pem'), keyPath: P('key.pem'), signingTime: at });
        // RSA PKCS#1 v1.5 is deterministic, so an identical input must reproduce
        // the identical envelope — which is what makes an audit replayable.
        assert.strictEqual(a.der.toString('hex'), b.der.toString('hex'));
    });

    // ── the assertion that actually counts ───────────────────────────────────
    section('independent verification (OpenSSL)');
    if (!hasOpenssl) {
        console.log('  ! openssl not available — skipping cross-implementation check');
    } else {
        t('OpenSSL parses the structure as pkcs7-signedData', () => {
            const out = openssl(['asn1parse', '-inform', 'DER', '-in', P('sig.der')]);
            assert.ok(/pkcs7-signedData/.test(out));
            assert.ok(/sha256/.test(out));
            assert.ok(/pkcs7-data/.test(out));
        });
        t('OpenSSL verifies the detached signature', () => {
            // openssl reports success on STDERR and signals it with exit code 0,
            // so the exit code is the assertion; the message is captured only to
            // make a failure readable.
            let stderr = '';
            assert.doesNotThrow(() => {
                const res = spawnSync('openssl', [
                    'cms', '-verify', '-inform', 'DER', '-in', P('sig.der'),
                    '-content', P('content.bin'), '-CAfile', P('cert.pem'),
                    '-purpose', 'any', '-out', '/dev/null',
                ], { encoding: 'utf8' });
                stderr = res.stderr || '';
                if (res.status !== 0) throw new Error(`openssl exited ${res.status}: ${stderr}`);
            });
            assert.ok(/Verification successful/i.test(stderr), `unexpected openssl output: ${stderr}`);
        });
        t('OpenSSL REJECTS the signature when the content is tampered with', () => {
            fs.writeFileSync(P('tampered.bin'), `${CONTENT}<!--tampered-->`);
            assert.throws(() => execFileSync('openssl', [
                'cms', '-verify', '-inform', 'DER', '-in', P('sig.der'),
                '-content', P('tampered.bin'), '-CAfile', P('cert.pem'),
                '-purpose', 'any', '-out', '/dev/null',
            ], { stdio: ['pipe', 'pipe', 'pipe'] }), 'a tampered declaration must not verify');
        });
        t('OpenSSL REJECTS the signature against an unrelated certificate', () => {
            assert.throws(() => execFileSync('openssl', [
                'cms', '-verify', '-inform', 'DER', '-in', P('sig.der'),
                '-content', P('content.bin'), '-CAfile', P('other-cert.pem'),
                '-purpose', 'any', '-out', '/dev/null',
            ], { stdio: ['pipe', 'pipe', 'pipe'] }), 'a foreign signer must not verify');
        });
    }

    console.log(`\n${pass} passed, ${fail} failed`);
} finally {
    fs.rmSync(DIR, { recursive: true, force: true });
}

if (fail) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
    process.exit(1);
}
