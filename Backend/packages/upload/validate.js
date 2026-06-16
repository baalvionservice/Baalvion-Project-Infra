'use strict';
// ─── @baalvion/upload/validate — CommonJS twin of validate.ts ─────────────────────
//
// The package `main` (src/index.ts) is TypeScript and pulls @aws-sdk + sharp, so the
// plain-JS backend services (cms, commerce, law, …) cannot `require('@baalvion/upload')`.
// This is the dependency-free CommonJS port of validate.ts so those services can adopt
// magic-byte validation + malware-scan hooks via `require('@baalvion/upload/validate.js')`.
// Keep BYTE-FOR-BYTE behaviour-aligned with validate.ts.

const { Buffer } = require('node:buffer');

const MIME_TO_TYPE = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/tiff': 'tiff',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'zip',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'zip',
  'application/zip': 'zip',
  'application/msword': 'ole2',
  'application/vnd.ms-excel': 'ole2',
  'application/vnd.ms-powerpoint': 'ole2',
};

function startsWith(buf, sig, offset = 0) {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

/** Detect a file's real type from its leading bytes. Returns 'unknown' if no signature matches. */
function sniffType(buf) {
  if (!buf || buf.length < 4) return 'unknown';
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return 'pdf';
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return 'gif';
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  if (startsWith(buf, [0x49, 0x49, 0x2a, 0x00]) || startsWith(buf, [0x4d, 0x4d, 0x00, 0x2a])) return 'tiff';
  if (startsWith(buf, [0x42, 0x4d])) return 'bmp';
  if (startsWith(buf, [0x00, 0x00, 0x01, 0x00])) return 'ico';
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'ole2';
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buf, [0x50, 0x4b, 0x05, 0x06]) || startsWith(buf, [0x50, 0x4b, 0x07, 0x08])) return 'zip';
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70], 4)) return 'mp4';
  const head = buf.subarray(0, 256).toString('utf8').trimStart().toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'svg';
  return 'unknown';
}

/**
 * Verify the payload bytes are consistent with the declared MIME type. Rejects a file whose real
 * signature contradicts what it claims to be (polyglot defense). Declared types we have no signature
 * for (text/*, json, csv, …) pass.
 * @returns {{ ok: boolean, detected: string, reason?: string }}
 */
function validateContent(buf, declaredMime) {
  const detected = sniffType(buf);
  const declaredKey = (declaredMime == null ? '' : String(declaredMime)).toLowerCase().split(';')[0].trim();
  const expected = MIME_TO_TYPE[declaredKey];
  if (!expected) return { ok: true, detected };
  if ((expected === 'zip' && detected === 'zip') || (expected === 'ole2' && detected === 'ole2')) {
    return { ok: true, detected };
  }
  if (detected === expected) return { ok: true, detected };
  return { ok: false, detected, reason: `declared ${declaredMime} but content signature is '${detected}'` };
}

// ─── Malware scan hook ─────────────────────────────────────────────────────────
const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

/**
 * Scan a payload. Always runs the EICAR baseline (so the scan path is verifiably active even with no
 * external scanner); if a `scanner` is provided its verdict is honored too.
 * @returns {Promise<{ clean: boolean, reason?: string }>}
 */
async function scanContent(buf, ctx = {}, scanner) {
  if (buf && buf.includes(Buffer.from(EICAR, 'ascii'))) {
    return { clean: false, reason: 'EICAR test signature detected' };
  }
  if (scanner) return scanner(buf, ctx);
  return { clean: true };
}

// ─── Production fail-fast guards ─────────────────────────────────────────────────
function assertS3ConfiguredForProduction(env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  const missing = ['S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'].filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`[@baalvion/upload] production requires S3 storage — missing: ${missing.join(', ')}`);
  }
}

/**
 * Fail-fast: in production a real malware scanner SHOULD be wired. Throws if not and
 * UPLOAD_SCAN_REQUIRED !== 'false' (default in production), so an operator must explicitly opt out.
 */
function requireScannerInProduction(scanner, env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  const required = (env.UPLOAD_SCAN_REQUIRED == null ? 'true' : env.UPLOAD_SCAN_REQUIRED) !== 'false';
  if (required && !scanner) {
    throw new Error('[@baalvion/upload] production requires a malware scanner; wire one (UPLOAD_SCAN_URL) or set UPLOAD_SCAN_REQUIRED=false to opt out');
  }
}

/**
 * Resolve a pluggable scanner from env. When UPLOAD_SCAN_URL is set, returns an HTTP scanner that
 * POSTs the raw bytes and expects a JSON `{ clean: boolean, reason?: string }` verdict (timeout-capped,
 * fail-closed on transport/parse error). Returns undefined when unconfigured — callers then rely on
 * requireScannerInProduction to fail closed in production. This is the documented integration hook for
 * ClamAV-via-HTTP-gateway, an AV API, or a scan microservice.
 * @returns {undefined | ((buf: Buffer, ctx: object) => Promise<{clean:boolean,reason?:string}>)}
 */
function getConfiguredScanner(env = process.env) {
  const url = env.UPLOAD_SCAN_URL;
  if (!url) return undefined;
  const timeoutMs = Number(env.UPLOAD_SCAN_TIMEOUT_MS || 8000);
  return function httpScanner(buf, ctx = {}) {
    return new Promise((resolve) => {
      let mod, u;
      try { u = new URL(url); mod = u.protocol === 'https:' ? require('node:https') : require('node:http'); }
      catch { return resolve({ clean: false, reason: 'scanner URL invalid (fail-closed)' }); }
      const req = mod.request(u, {
        method: 'POST',
        timeout: timeoutMs,
        headers: {
          'content-type': 'application/octet-stream',
          'content-length': buf.length,
          ...(ctx.filename ? { 'x-file-name': encodeURIComponent(String(ctx.filename)) } : {}),
          ...(ctx.mime ? { 'x-file-mime': String(ctx.mime) } : {}),
        },
      }, (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          if (res.statusCode !== 200) return resolve({ clean: false, reason: `scanner HTTP ${res.statusCode} (fail-closed)` });
          try {
            const v = JSON.parse(body);
            resolve({ clean: v.clean === true, reason: v.reason });
          } catch { resolve({ clean: false, reason: 'scanner returned non-JSON (fail-closed)' }); }
        });
      });
      req.on('error', () => resolve({ clean: false, reason: 'scanner unreachable (fail-closed)' }));
      req.on('timeout', () => { req.destroy(); resolve({ clean: false, reason: 'scanner timeout (fail-closed)' }); });
      req.end(buf);
    });
  };
}

/**
 * One-call upload guard: magic-byte validation → production fail-closed scanner check → malware scan.
 * Returns a structured verdict the caller maps to an HTTP response — keeps per-service integration to
 * ~2 lines. Pass `opts.scanner` to inject one explicitly; otherwise it resolves from env
 * (getConfiguredScanner). In production with no scanner wired (and UPLOAD_SCAN_REQUIRED !== 'false')
 * it FAILS CLOSED with status 503.
 *
 * @param {Buffer} buf
 * @param {{ filename?: string, declaredMime?: string, mime?: string, scanner?: Function }} [opts]
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Promise<{ ok: boolean, status: number, code?: string, message?: string, detected: string }>}
 */
async function guardUpload(buf, opts = {}, env = process.env) {
  const declaredMime = opts.declaredMime || opts.mime || '';
  const v = validateContent(buf, declaredMime);
  if (!v.ok) {
    return { ok: false, status: 415, code: 'UNSUPPORTED_MEDIA_TYPE', message: v.reason, detected: v.detected };
  }
  const scanner = Object.prototype.hasOwnProperty.call(opts, 'scanner') ? opts.scanner : getConfiguredScanner(env);
  try {
    requireScannerInProduction(scanner, env);
  } catch (e) {
    return { ok: false, status: 503, code: 'MALWARE_SCANNER_REQUIRED', message: e.message, detected: v.detected };
  }
  const scan = await scanContent(buf, { filename: opts.filename, mime: declaredMime }, scanner);
  if (!scan.clean) {
    return { ok: false, status: 422, code: 'MALWARE_DETECTED', message: scan.reason || 'file failed malware scan', detected: v.detected };
  }
  return { ok: true, status: 200, detected: v.detected };
}

module.exports = {
  sniffType,
  validateContent,
  scanContent,
  assertS3ConfiguredForProduction,
  requireScannerInProduction,
  getConfiguredScanner,
  guardUpload,
};
