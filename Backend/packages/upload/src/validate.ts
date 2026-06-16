// ─── @baalvion/upload — content validation, magic-byte sniffing, scan hooks ────
//
// MIME-header / extension checks (acl.ts) are trivially spoofable: a request can claim
// `image/png` for an executable. This module inspects the actual file BYTES (magic numbers)
// and rejects a payload whose real type contradicts its declared type (polyglot defense),
// plus a pluggable malware-scan hook with an always-on EICAR baseline. Mirrors the hardened
// trade-service document engine so non-trade upload paths get the same protection.

import { Buffer } from 'node:buffer';

export type DetectedType =
  | 'pdf' | 'png' | 'jpeg' | 'gif' | 'webp' | 'tiff' | 'bmp' | 'ico'
  | 'zip' | 'ole2' | 'mp4' | 'svg' | 'unknown';

/** Map a declared MIME type to the byte-signature family we expect to sniff. */
const MIME_TO_TYPE: Record<string, DetectedType> = {
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
  // OOXML (docx/xlsx/pptx) and legacy zips are all PKZIP containers
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'zip',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'zip',
  'application/zip': 'zip',
  // Legacy OLE2 office documents
  'application/msword': 'ole2',
  'application/vnd.ms-excel': 'ole2',
  'application/vnd.ms-powerpoint': 'ole2',
};

function startsWith(buf: Buffer, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

/** Detect a file's real type from its leading bytes. Returns 'unknown' if no signature matches. */
export function sniffType(buf: Buffer): DetectedType {
  if (!buf || buf.length < 4) return 'unknown';
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return 'pdf'; // %PDF
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return 'gif'; // GIF8
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  if (startsWith(buf, [0x49, 0x49, 0x2a, 0x00]) || startsWith(buf, [0x4d, 0x4d, 0x00, 0x2a])) return 'tiff';
  if (startsWith(buf, [0x42, 0x4d])) return 'bmp';
  if (startsWith(buf, [0x00, 0x00, 0x01, 0x00])) return 'ico';
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'ole2';
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buf, [0x50, 0x4b, 0x05, 0x06]) || startsWith(buf, [0x50, 0x4b, 0x07, 0x08])) return 'zip';
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70], 4)) return 'mp4'; // ....ftyp
  // SVG / XML are text — sniff the first non-whitespace chars
  const head = buf.subarray(0, 256).toString('utf8').trimStart().toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'svg';
  return 'unknown';
}

export interface ContentValidationResult {
  ok: boolean;
  detected: DetectedType;
  reason?: string;
}

/**
 * Verify the payload bytes are consistent with the declared MIME type. Rejects a file whose real
 * signature contradicts what it claims to be (e.g. an "image/png" that is actually a ZIP/exe).
 * For declared types we don't have a binary signature for (e.g. text/plain, text/csv), passes.
 */
export function validateContent(buf: Buffer, declaredMime: string): ContentValidationResult {
  const detected = sniffType(buf);
  const declaredKey = (declaredMime ?? '').toLowerCase().split(';')[0]?.trim() ?? '';
  const expected = MIME_TO_TYPE[declaredKey];

  if (!expected) {
    // We have no signature for this declared type (text/*, json, csv, …) — nothing to contradict.
    return { ok: true, detected };
  }
  // OOXML docx/xlsx/pptx are zip containers; legacy office is OLE2. Accept either for those.
  if ((expected === 'zip' && (detected === 'zip')) || (expected === 'ole2' && detected === 'ole2')) {
    return { ok: true, detected };
  }
  if (detected === expected) {
    return { ok: true, detected };
  }
  return {
    ok: false,
    detected,
    reason: `declared ${declaredMime} but content signature is '${detected}'`,
  };
}

// ─── Malware scan hook ─────────────────────────────────────────────────────────

export interface ScanResult {
  clean: boolean;
  reason?: string;
}

/** A pluggable scanner — wire ClamAV (INSTREAM) or an AV API. Receives the raw bytes. */
export type FileScanner = (buf: Buffer, ctx: { filename?: string; mime?: string }) => Promise<ScanResult>;

// EICAR antivirus test signature — always detected as a baseline so the scan path is verifiably
// active even when no external scanner is wired (matches the trade-service engine).
const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

/**
 * Scan a payload. Always runs the EICAR baseline; if a `scanner` is provided (e.g. ClamAV), its
 * verdict is honored too. In production, callers SHOULD wire a real scanner — see
 * requireScannerInProduction.
 */
export async function scanContent(
  buf: Buffer,
  ctx: { filename?: string; mime?: string } = {},
  scanner?: FileScanner,
): Promise<ScanResult> {
  if (buf && buf.includes(Buffer.from(EICAR, 'ascii'))) {
    return { clean: false, reason: 'EICAR test signature detected' };
  }
  if (scanner) {
    return scanner(buf, ctx);
  }
  return { clean: true };
}

// ─── Production fail-fast guards ─────────────────────────────────────────────────

/**
 * Fail-fast at startup: in production, S3 must be configured — a deploy that silently falls back
 * to local-disk or empty-bucket storage loses files and bypasses bucket-level controls. Throws.
 */
export function assertS3ConfiguredForProduction(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;
  const missing = ['S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'].filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(
      `[@baalvion/upload] production requires S3 storage — missing: ${missing.join(', ')}`,
    );
  }
}

/**
 * Fail-fast at startup: in production a real malware scanner SHOULD be wired. Throws if not and
 * UPLOAD_SCAN_REQUIRED=true (default in production), so an operator must explicitly opt out.
 */
export function requireScannerInProduction(
  scanner: FileScanner | undefined,
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== 'production') return;
  const required = (env.UPLOAD_SCAN_REQUIRED ?? 'true') !== 'false';
  if (required && !scanner) {
    throw new Error(
      '[@baalvion/upload] production requires a malware scanner; wire one or set UPLOAD_SCAN_REQUIRED=false to opt out',
    );
  }
}
