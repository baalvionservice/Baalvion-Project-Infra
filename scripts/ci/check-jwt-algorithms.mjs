#!/usr/bin/env node
// Phase 10 CI guard — RS256-only; no jwt.verify without `algorithms`, no HS256 acceptance,
// no algorithm wildcarding. Sanctioned legacy compatibility lives ONLY in @baalvion/auth-node
// (the One True Verifier owns the bounded HS256-fallback logic) — it is allowlisted.
'use strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'Backend';
const ALLOW = ['Backend/packages/auth-node']; // owns the documented, bounded alg logic + tests
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.turbo']);
const EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);
const norm = (p) => p.split(path.sep).join('/');
const allowed = (f) => ALLOW.some((a) => norm(f).includes(a));

const viol = [];
function check(f, src) {
  const lines = src.split('\n');
  lines.forEach((ln, i) => {
    const at = (msg) => viol.push({ f: norm(f), n: i + 1, msg, ln: ln.trim() });
    // jwt.verify(...) with no algorithms pin within the call (scan a 5-line window for the
    // multi-line options object).
    if (/\bjwt\.verify\s*\(/.test(ln) && !/algorithms\s*:/.test(lines.slice(i, i + 5).join('\n'))) at('jwt.verify without algorithms pin');
    // explicit HS256 acceptance in a verify/algorithms context
    if (/algorithms\s*:\s*\[[^\]]*HS256/i.test(ln)) at("HS256 accepted in algorithms[]");
    // wildcard
    if (/algorithms\s*:\s*\[\s*['"]\*['"]/.test(ln)) at('algorithm wildcard');
  });
}
function walk(dir) {
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(full); continue; }
    if (!EXT.has(path.extname(e.name)) || allowed(full)) continue;
    check(full, fs.readFileSync(full, 'utf8'));
  }
}
walk(ROOT);
if (viol.length) {
  console.error(`[check-jwt-algorithms] FAIL — ${viol.length} algorithm issue(s) (RS256-only expected):`);
  for (const v of viol) console.error(`  ${v.f}:${v.n}: ${v.msg}\n      ${v.ln}`);
  process.exit(1);
}
console.log('[check-jwt-algorithms] OK');
