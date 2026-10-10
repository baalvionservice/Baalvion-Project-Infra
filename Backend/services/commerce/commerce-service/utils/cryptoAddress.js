'use strict';
const crypto = require('node:crypto');

// Checksum validation for the receiving addresses an admin pastes in. A wrong character here sends a
// seller's $2,000 to the wrong place, so a plain regex is not enough: Bitcoin and Tron addresses carry
// a checksum and we verify it.

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const sha256 = (b) => crypto.createHash('sha256').update(b).digest();

function base58Decode(str) {
    let n = 0n;
    for (const ch of str) {
        const i = B58.indexOf(ch);
        if (i < 0) return null;
        n = n * 58n + BigInt(i);
    }
    let hex = n.toString(16);
    if (hex.length % 2) hex = `0${hex}`;
    let bytes = Buffer.from(hex === '00' ? '' : hex, 'hex');
    const zeros = str.length - str.replace(/^1+/, '').length;
    bytes = Buffer.concat([Buffer.alloc(zeros), bytes]);
    return bytes;
}

// Base58Check: payload + 4-byte double-SHA256 checksum.
function base58CheckPayload(str) {
    const raw = base58Decode(str);
    if (!raw || raw.length < 5) return null;
    const payload = raw.subarray(0, raw.length - 4);
    const check = raw.subarray(raw.length - 4);
    return sha256(sha256(payload)).subarray(0, 4).equals(check) ? payload : null;
}

const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
function bech32Polymod(values) {
    const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    for (const v of values) {
        const top = chk >>> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ v;
        for (let i = 0; i < 5; i += 1) if ((top >>> i) & 1) chk ^= GEN[i];
    }
    return chk >>> 0;
}
function bech32Valid(addr) {
    if (addr !== addr.toLowerCase() && addr !== addr.toUpperCase()) return false;
    const a = addr.toLowerCase();
    const pos = a.lastIndexOf('1');
    if (pos < 1 || pos + 7 > a.length || a.length > 90) return false;
    const hrp = a.slice(0, pos);
    if (hrp !== 'bc') return false;
    const data = [];
    for (const ch of a.slice(pos + 1)) { const i = BECH32.indexOf(ch); if (i < 0) return false; data.push(i); }
    const expand = [...hrp].map((c) => c.charCodeAt(0) >> 5).concat([0], [...hrp].map((c) => c.charCodeAt(0) & 31));
    const pm = bech32Polymod(expand.concat(data));
    const version = data[0];
    return version === 0 ? pm === 1 : pm === 0x2bc830a3; // bech32 for v0, bech32m for v1+
}

const isBitcoinAddress = (a) => {
    if (/^bc1/i.test(a)) return bech32Valid(a);
    if (!/^[13]/.test(a)) return false;
    const p = base58CheckPayload(a);
    return !!p && p.length === 21 && (p[0] === 0x00 || p[0] === 0x05);
};
const isTronAddress = (a) => /^T/.test(a) && a.length === 34 && (() => { const p = base58CheckPayload(a); return !!p && p.length === 21 && p[0] === 0x41; })();
// Solana addresses are 32 raw bytes in base58 and carry no checksum, so length is all we can verify here.
const isSolanaAddress = (a) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a) && (() => { const b = base58Decode(a); return !!b && b.length === 32; })();
const isEvmAddress = (a) => /^0x[a-fA-F0-9]{40}$/.test(a);
const isBinancePayId = (a) => /^\d{6,20}$/.test(a);

module.exports = { isBitcoinAddress, isTronAddress, isEvmAddress, isSolanaAddress, isBinancePayId };
