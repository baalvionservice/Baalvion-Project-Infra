'use strict';
/**
 * Message signing for customs gateways (Customs Connectors).
 *
 * Mutual TLS authenticates the CHANNEL. Several jurisdictions additionally
 * require the message BODY to be signed, so that the declaration itself carries
 * a non-repudiable signature independent of the transport — India's Class-3 DSC
 * requirement is the clearest example. A TLS session proves who opened the
 * connection; it proves nothing about what was declared.
 *
 * Produces a real RFC 5652 CMS SignedData in DETACHED form (the content is not
 * embedded, only its digest), which is what these gateways expect alongside the
 * message rather than wrapped around it.
 *
 * The signed attributes are the standard three that verifiers expect:
 *   contentType    (1.2.840.113549.1.9.3)
 *   messageDigest  (1.2.840.113549.1.9.4)
 *   signingTime    (1.2.840.113549.1.9.5)
 *
 * The signature is computed over the DER SET OF encoding of those attributes —
 * NOT over the [0] IMPLICIT form that appears in the SignerInfo. Getting that
 * wrong produces a structure that looks right and fails verification everywhere;
 * `signedAttrsForSigning()` below exists solely to make the distinction explicit.
 *
 * Verified against OpenSSL in tests/customs-signing.verify.js — a signature this
 * module produces is checked with `openssl cms -verify`, because a hand-built
 * CMS that only this codebase can validate is worthless.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const der = require('./der');

const OID = Object.freeze({
    DATA: '1.2.840.113549.1.7.1',
    SIGNED_DATA: '1.2.840.113549.1.7.2',
    SHA256: '2.16.840.1.101.3.4.2.1',
    SHA384: '2.16.840.1.101.3.4.2.2',
    SHA512: '2.16.840.1.101.3.4.2.3',
    RSA_ENCRYPTION: '1.2.840.113549.1.1.1',
    ECDSA_WITH_SHA256: '1.2.840.10045.4.3.2',
    EC_PUBLIC_KEY: '1.2.840.10045.2.1',
    CONTENT_TYPE: '1.2.840.113549.1.9.3',
    MESSAGE_DIGEST: '1.2.840.113549.1.9.4',
    SIGNING_TIME: '1.2.840.113549.1.9.5',
});

const DIGEST_OID = Object.freeze({ sha256: OID.SHA256, sha384: OID.SHA384, sha512: OID.SHA512 });

class SigningError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'SigningError';
        this.details = details;
    }
}

function readFile(p, label) {
    const resolved = path.resolve(p);
    try {
        const buf = fs.readFileSync(resolved);
        if (!buf.length) throw new SigningError(`${label} at ${resolved} is empty`);
        return buf;
    } catch (err) {
        if (err instanceof SigningError) throw err;
        throw new SigningError(`${label} could not be read at ${resolved}: ${err.code || err.message}`, { path: resolved });
    }
}

/** PEM certificate → DER. */
function pemToDer(pem) {
    const match = String(pem).match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/);
    if (!match) throw new SigningError('signing certificate is not a PEM certificate');
    return Buffer.from(match[1].replace(/\s+/g, ''), 'base64');
}

/** One CMS Attribute ::= SEQUENCE { attrType OID, attrValues SET OF ANY }. */
const attribute = (typeOid, valueDer) => der.sequence(der.oid(typeOid), der.setOf([valueDer]));

/**
 * The signed attributes, in the two encodings that matter.
 *
 * `forSigning` carries the universal SET tag (0x31) and is what gets signed;
 * `forStructure` carries the [0] IMPLICIT tag (0xa0) and is what goes into the
 * SignerInfo. Same contents, different first byte — and signing the wrong one is
 * the single most common way a hand-built CMS fails verification.
 */
function buildSignedAttrs({ contentDigest, signingTime, digestAlg }) {
    const attrs = [
        attribute(OID.CONTENT_TYPE, der.oid(OID.DATA)),
        attribute(OID.SIGNING_TIME, der.utcTime(signingTime)),
        attribute(OID.MESSAGE_DIGEST, der.octetString(contentDigest)),
    ];
    const forSigning = der.setOf(attrs);              // 0x31 SET OF — signed
    const forStructure = Buffer.concat([              // 0xa0 [0] IMPLICIT — carried
        Buffer.from([0xa0]),
        forSigning.subarray(1),
    ]);
    return { forSigning, forStructure, digestAlg };
}

/** Signature AlgorithmIdentifier for the key type in play. */
function signatureAlgorithm(keyType) {
    if (keyType === 'ec') return der.algorithmIdentifier(OID.ECDSA_WITH_SHA256, { absentParams: true });
    // RSA PKCS#1 v1.5 carries an explicit NULL parameter.
    return der.algorithmIdentifier(OID.RSA_ENCRYPTION);
}

/**
 * Build a detached CMS SignedData over `content`.
 *
 * @param {Buffer|string} content     the exact bytes that will be transmitted
 * @param {object} opts               { certPath|certPem, keyPath|keyPem, passphrase, digest, signingTime }
 * @returns {{ der: Buffer, base64: string, digest: string, signing_time: string, signer: object }}
 */
function signDetachedCms(content, {
    certPath = null, certPem = null,
    keyPath = null, keyPem = null,
    passphrase = null,
    digest = 'sha256',
    signingTime = new Date(),
} = {}) {
    if (!DIGEST_OID[digest]) throw new SigningError(`unsupported digest '${digest}'`, { supported: Object.keys(DIGEST_OID) });

    const certBuf = certPem ? Buffer.from(certPem) : readFile(certPath, 'signing certificate');
    const keyBuf = keyPem ? Buffer.from(keyPem) : readFile(keyPath, 'signing private key');
    const data = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');

    const certDer = pemToDer(certBuf.toString('utf8'));

    let privateKey;
    try {
        privateKey = crypto.createPrivateKey(passphrase
            ? { key: keyBuf, passphrase }
            : keyBuf);
    } catch (err) {
        throw new SigningError(
            `signing private key could not be loaded${passphrase ? '' : ' (is it passphrase-protected?)'}: ${err.message}`,
        );
    }

    // A key that does not belong to the certificate produces a signature that
    // verifies against nothing. Catch it here, not at the authority.
    const certPublicKey = new crypto.X509Certificate(certBuf).publicKey;
    if (!crypto.createPublicKey(privateKey).equals(certPublicKey)) {
        throw new SigningError('the signing private key does not match the public key in the signing certificate');
    }

    const { serialNumber, issuerDer } = der.certificateIssuerAndSerial(certDer);
    const contentDigest = crypto.createHash(digest).update(data).digest();
    const { forSigning, forStructure } = buildSignedAttrs({ contentDigest, signingTime, digestAlg: digest });

    const signature = crypto.sign(digest, forSigning, privateKey);
    const digestAlgId = der.algorithmIdentifier(DIGEST_OID[digest]);

    // SignerInfo ::= SEQUENCE { version, sid, digestAlgorithm,
    //                           [0] signedAttrs, signatureAlgorithm, signature }
    const signerInfo = der.sequence(
        der.integer(1),                                            // version 1 (issuerAndSerialNumber)
        der.sequence(issuerDer, der.integer(serialNumber)),        // IssuerAndSerialNumber
        digestAlgId,
        forStructure,
        signatureAlgorithm(privateKey.asymmetricKeyType),
        der.octetString(signature),
    );

    // SignedData ::= SEQUENCE { version, digestAlgorithms, encapContentInfo,
    //                           [0] certificates, signerInfos }
    // Detached: encapContentInfo carries the eContentType and NO eContent.
    const signedData = der.sequence(
        der.integer(1),
        der.setOf([digestAlgId]),
        der.sequence(der.oid(OID.DATA)),
        der.contextConstructed(0, certDer),
        der.setOf([signerInfo]),
    );

    const contentInfo = der.sequence(
        der.oid(OID.SIGNED_DATA),
        der.contextConstructed(0, signedData),
    );

    const x509 = new crypto.X509Certificate(certBuf);
    return {
        der: contentInfo,
        base64: contentInfo.toString('base64'),
        digest_algorithm: digest,
        content_digest: contentDigest.toString('base64'),
        signing_time: new Date(signingTime).toISOString(),
        signer: {
            subject: x509.subject,
            issuer: x509.issuer,
            serial: serialNumber.toString('hex').toUpperCase(),
            valid_to: new Date(x509.validTo).toISOString(),
            key_type: privateKey.asymmetricKeyType,
        },
    };
}

/**
 * Bare detached signature (base64) for gateways that ask for a signature value
 * rather than a full CMS envelope. Same key material, far simpler envelope.
 */
function signRaw(content, { keyPath = null, keyPem = null, passphrase = null, digest = 'sha256' } = {}) {
    const keyBuf = keyPem ? Buffer.from(keyPem) : readFile(keyPath, 'signing private key');
    const data = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
    const privateKey = crypto.createPrivateKey(passphrase ? { key: keyBuf, passphrase } : keyBuf);
    return {
        algorithm: `${digest}With${privateKey.asymmetricKeyType === 'ec' ? 'ECDSA' : 'RSA'}`,
        signature: crypto.sign(digest, data, privateKey).toString('base64'),
        digest: crypto.createHash(digest).update(data).digest('base64'),
    };
}

/**
 * Verify a detached CMS we produced. Not a full RFC 5652 verifier — it checks
 * the signature and the message digest, which is what a round-trip self-test
 * needs. Cross-implementation confidence comes from the OpenSSL check in the
 * verify harness, not from this.
 */
function verifyDetachedCms(content, cmsDer, certPem) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
    const contentInfo = der.readTlv(cmsDer, 0);
    const ci = der.children(contentInfo.value);
    const signedDataWrapper = der.readTlv(ci[1].value, 0);
    const sd = der.children(signedDataWrapper.value);

    const signerInfos = sd[sd.length - 1];
    const signerInfo = der.readTlv(signerInfos.value, 0);
    const si = der.children(signerInfo.value);

    // [0] IMPLICIT signedAttrs → re-tag to SET OF to reconstruct signed bytes.
    const signedAttrsField = si.find((f) => f.tag === 0xa0);
    if (!signedAttrsField) throw new SigningError('CMS carries no signed attributes');
    const forSigning = Buffer.concat([Buffer.from([0x31]), signedAttrsField.raw.subarray(1)]);

    const signatureField = si[si.length - 1];
    const publicKey = new crypto.X509Certificate(certPem).publicKey;
    const signatureValid = crypto.verify('sha256', forSigning, publicKey, signatureField.value);

    const expectedDigest = crypto.createHash('sha256').update(data).digest();
    const digestPresent = signedAttrsField.raw.includes(expectedDigest);

    return { signatureValid, digestMatches: digestPresent, valid: signatureValid && digestPresent };
}

module.exports = {
    OID,
    DIGEST_OID,
    SigningError,
    pemToDer,
    buildSignedAttrs,
    signDetachedCms,
    signRaw,
    verifyDetachedCms,
};
