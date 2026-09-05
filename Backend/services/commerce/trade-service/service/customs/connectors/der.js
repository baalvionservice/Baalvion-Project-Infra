'use strict';
/**
 * Minimal ASN.1 DER encoder + parser (Customs Connectors).
 *
 * Exists because customs message signing is PKCS#7/CMS, and Node's crypto module
 * produces a bare signature — the SignedData structure around it has to be built
 * by hand. This is the narrow subset needed for RFC 5652 SignedData and for
 * reading an issuer and serial out of an X.509 certificate. It is not a general
 * ASN.1 library and should not grow into one.
 *
 * DER, not BER. The distinction is the whole point: the signature is computed
 * over an encoding, so the encoding must be canonical or verification fails
 * somewhere else, weeks later, against someone else's implementation. That means
 *   • minimal-length integers, with a leading zero only to clear the sign bit
 *   • definite, minimal-form lengths
 *   • SET OF sorted by the DER encoding of its members
 * All three are implemented below and all three are load-bearing.
 */

const TAG = Object.freeze({
    BOOLEAN: 0x01,
    INTEGER: 0x02,
    BIT_STRING: 0x03,
    OCTET_STRING: 0x04,
    NULL: 0x05,
    OID: 0x06,
    UTF8_STRING: 0x0c,
    SEQUENCE: 0x30,
    SET: 0x31,
    PRINTABLE_STRING: 0x13,
    IA5_STRING: 0x16,
    UTC_TIME: 0x17,
    GENERALIZED_TIME: 0x18,
});

class DerError extends Error {
    constructor(message) { super(message); this.name = 'DerError'; }
}

/** DER length octets: short form under 128, else long form with minimal bytes. */
function encodeLength(len) {
    if (len < 0) throw new DerError('negative length');
    if (len < 0x80) return Buffer.from([len]);
    const bytes = [];
    let n = len;
    while (n > 0) { bytes.unshift(n & 0xff); n >>= 8; }
    if (bytes.length > 126) throw new DerError('length too large');
    return Buffer.from([0x80 | bytes.length, ...bytes]);
}

/** Wrap a payload in a tag + length. */
function tlv(tag, payload) {
    const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
    return Buffer.concat([Buffer.from([tag]), encodeLength(body.length), body]);
}

/**
 * INTEGER. Minimal two's-complement: strip redundant leading zero bytes, then
 * re-add exactly one if the top bit would otherwise read as negative.
 */
function integer(value) {
    let buf;
    if (Buffer.isBuffer(value)) {
        buf = Buffer.from(value);
    } else {
        const n = BigInt(value);
        if (n === 0n) buf = Buffer.from([0]);
        else {
            let hex = n.toString(16);
            if (hex.length % 2) hex = `0${hex}`;
            buf = Buffer.from(hex, 'hex');
        }
    }
    let start = 0;
    while (start < buf.length - 1 && buf[start] === 0x00 && (buf[start + 1] & 0x80) === 0) start += 1;
    buf = buf.subarray(start);
    if (buf[0] & 0x80) buf = Buffer.concat([Buffer.from([0x00]), buf]);
    return tlv(TAG.INTEGER, buf);
}

/** OBJECT IDENTIFIER from dotted decimal. */
function oid(dotted) {
    const parts = String(dotted).split('.').map((p) => {
        const n = Number(p);
        if (!Number.isInteger(n) || n < 0) throw new DerError(`invalid OID arc '${p}'`);
        return n;
    });
    if (parts.length < 2) throw new DerError('an OID needs at least two arcs');
    const bytes = [parts[0] * 40 + parts[1]];
    for (const arc of parts.slice(2)) {
        // Base-128, most significant group first, continuation bit on all but last.
        const group = [];
        let n = arc;
        do { group.unshift(n & 0x7f); n >>>= 7; } while (n > 0);
        for (let k = 0; k < group.length - 1; k += 1) group[k] |= 0x80;
        bytes.push(...group);
    }
    return tlv(TAG.OID, Buffer.from(bytes));
}

const nullValue = () => Buffer.from([TAG.NULL, 0x00]);
const octetString = (buf) => tlv(TAG.OCTET_STRING, buf);
const sequence = (...items) => tlv(TAG.SEQUENCE, Buffer.concat(items.flat()));

/**
 * SET OF — members sorted by their DER encoding, as DER requires. Verifiers do
 * enforce this, and an unsorted SET is the classic reason a hand-built CMS
 * validates locally and is rejected by the counterparty.
 */
function setOf(items) {
    const sorted = items.slice().sort(Buffer.compare);
    return tlv(TAG.SET, Buffer.concat(sorted));
}

/** Context-specific constructed tag [n]. */
const contextConstructed = (n, payload) => tlv(0xa0 | n, payload);
/** Context-specific primitive tag [n]. */
const contextPrimitive = (n, payload) => tlv(0x80 | n, payload);

/** UTCTime — the encoding CMS signingTime uses for dates before 2050. */
function utcTime(date) {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    if (year < 1950 || year >= 2050) throw new DerError('UTCTime only covers 1950-2049; use GeneralizedTime');
    const p = (n) => String(n).padStart(2, '0');
    const s = `${p(year % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`
        + `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
    return tlv(TAG.UTC_TIME, Buffer.from(s, 'ascii'));
}

/** AlgorithmIdentifier ::= SEQUENCE { algorithm OID, parameters ANY OPTIONAL } */
function algorithmIdentifier(algOid, { absentParams = false } = {}) {
    return absentParams ? sequence(oid(algOid)) : sequence(oid(algOid), nullValue());
}

// ── Parsing (only what is needed to read a certificate) ─────────────────────

/** Read one TLV at `offset`. Returns { tag, length, headerLength, value, end }. */
function readTlv(buf, offset = 0) {
    if (offset >= buf.length) throw new DerError('unexpected end of DER data');
    const tag = buf[offset];
    let pos = offset + 1;
    if (pos >= buf.length) throw new DerError('truncated DER length');
    let length = buf[pos];
    pos += 1;
    if (length & 0x80) {
        const count = length & 0x7f;
        if (count === 0) throw new DerError('indefinite length is not valid DER');
        if (pos + count > buf.length) throw new DerError('truncated DER long-form length');
        length = 0;
        for (let k = 0; k < count; k += 1) { length = (length << 8) | buf[pos + k]; }
        pos += count;
    }
    const end = pos + length;
    if (end > buf.length) throw new DerError('DER value extends past the buffer');
    return { tag, length, headerLength: pos - offset, value: buf.subarray(pos, end), end };
}

/** Every immediate child TLV of a constructed value. */
function children(value) {
    const out = [];
    let offset = 0;
    while (offset < value.length) {
        const node = readTlv(value, offset);
        out.push({ ...node, raw: value.subarray(offset, node.end) });
        offset = node.end;
    }
    return out;
}

/**
 * Extract the issuer DN (raw DER) and serial number from an X.509 certificate.
 *
 * CMS identifies a signer by issuer + serial, and both must be the EXACT bytes
 * from the certificate — a re-encoded DN will not match at the verifier, so the
 * issuer is carried through as raw DER rather than parsed and rebuilt.
 */
function certificateIssuerAndSerial(derCert) {
    const cert = readTlv(derCert, 0);
    if (cert.tag !== TAG.SEQUENCE) throw new DerError('certificate is not a SEQUENCE');
    const tbs = readTlv(cert.value, 0);
    if (tbs.tag !== TAG.SEQUENCE) throw new DerError('tbsCertificate is not a SEQUENCE');

    const fields = children(tbs.value);
    let index = 0;
    // [0] EXPLICIT version is optional; skip it when present.
    if (fields[index] && fields[index].tag === 0xa0) index += 1;

    const serialField = fields[index];
    if (!serialField || serialField.tag !== TAG.INTEGER) throw new DerError('serialNumber not found');
    index += 1;

    index += 1; // signature AlgorithmIdentifier

    const issuerField = fields[index];
    if (!issuerField || issuerField.tag !== TAG.SEQUENCE) throw new DerError('issuer Name not found');

    return {
        serialNumber: Buffer.from(serialField.value),
        issuerDer: Buffer.from(issuerField.raw),
    };
}

module.exports = {
    TAG,
    DerError,
    encodeLength,
    tlv,
    integer,
    oid,
    nullValue,
    octetString,
    sequence,
    setOf,
    contextConstructed,
    contextPrimitive,
    utcTime,
    algorithmIdentifier,
    readTlv,
    children,
    certificateIssuerAndSerial,
};
