// Dependency-free secret scanner. It complements gitleaks in CI: it knows the
// Solana-specific shapes (keypair JSON arrays, base58 secret keys) that
// generic scanners often miss, and it runs locally with no install.
//
// A line containing the marker `secret-scan:allow` is skipped.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

export interface Finding {
  readonly file: string;
  readonly line: number;
  readonly rule: string;
}

interface Rule {
  readonly id: string;
  readonly test: (line: string) => boolean;
}

const ALLOW_MARKER = 'secret-scan:allow';

function looksLikeKeypairArray(line: string): boolean {
  const match = /\[\s*(?:\d{1,3}\s*,\s*){63}\d{1,3}\s*\]/.exec(line);
  if (!match) return false;
  return match[0]
    .slice(1, -1)
    .split(',')
    .every((n) => Number(n.trim()) <= 255);
}

const RULES: readonly Rule[] = [
  { id: 'pem-private-key', test: (l) => /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(l) },
  { id: 'solana-keypair-array', test: looksLikeKeypairArray },
  { id: 'base58-secret-key', test: (l) => /\b[1-9A-HJ-NP-Za-km-z]{86,88}\b/.test(l) },
  {
    id: 'seed-phrase',
    test: (l) =>
      /(mnemonic|seed[ _-]?phrase|recovery[ _-]?phrase)\s*[:=]\s*["']?([a-z]{3,8}\s+){11,23}[a-z]{3,8}/i.test(
        l,
      ),
  },
  { id: 'aws-access-key', test: (l) => /\bAKIA[0-9A-Z]{16}\b/.test(l) },
  { id: 'github-token', test: (l) => /\bgh[pousr]_[A-Za-z0-9]{36,}\b/.test(l) },
  { id: 'url-credentials', test: (l) => /\bhttps?:\/\/[^/\s:@"']+:[^/\s@"']+@/.test(l) },
  {
    id: 'url-api-key',
    test: (l) => /https?:\/\/[^\s"']*[?&](api[-_]?key|token|key)=[A-Za-z0-9_-]{8,}/i.test(l),
  },
  {
    id: 'assigned-secret',
    test: (l) =>
      /^\s*(export\s+)?[A-Z0-9_]*(PRIVATE_KEY|SECRET|PASSWORD|PASSPHRASE|MNEMONIC|SEED|KEYPAIR|API_KEY)[A-Z0-9_]*\s*=\s*(?!["']?\s*$)(?!["']?<)\S+/.test(
        l,
      ),
  },
];

const FORBIDDEN_FILENAMES: readonly RegExp[] = [
  /^id\.json$/,
  /keypair.*\.json$/i,
  /^wallet.*\.json$/i,
  /\.(pem|key|p12|pfx|jks|keystore|mnemonic|seed)$/i,
  /^\.env(\..+)?$/,
];
const ALLOWED_FILENAMES = new Set(['.env.example']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage']);
const SKIP_FILES = new Set(['pnpm-lock.yaml']);
const MAX_BYTES = 2_000_000;

export function scanText(file: string, text: string): Finding[] {
  const findings: Finding[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.includes(ALLOW_MARKER)) return;
    for (const rule of RULES) {
      if (rule.test(line)) findings.push({ file, line: index + 1, rule: rule.id });
    }
  });
  return findings;
}

export function isForbiddenFilename(name: string): boolean {
  if (ALLOWED_FILENAMES.has(name)) return false;
  return FORBIDDEN_FILENAMES.some((re) => re.test(name));
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

export function scanDirectory(root: string): Finding[] {
  const findings: Finding[] = [];
  for (const path of walk(root)) {
    const name = basename(path);
    const rel = relative(root, path);
    if (isForbiddenFilename(name))
      findings.push({ file: rel, line: 0, rule: 'forbidden-filename' });
    if (SKIP_FILES.has(name) || statSync(path).size > MAX_BYTES) continue;
    const buffer = readFileSync(path);
    if (buffer.includes(0)) continue;
    findings.push(...scanText(rel, buffer.toString('utf8')));
  }
  return findings;
}
