#!/usr/bin/env node
// Phase 10 CI guard — no auth token persistence in localStorage/sessionStorage. Allowlist: NONE.
'use strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'Frontend';
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.turbo']);
const EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue', '.svelte']);
// (local|session)Storage.setItem('...token|jwt|auth|session...', ...)
const RE = /(local|session)Storage\.setItem\(\s*[`'"][^`'"]*(token|jwt|auth|session)[^`'"]*[`'"]/i;
const norm = (p) => p.split(path.sep).join('/');

const viol = [];
function walk(dir) {
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(full); continue; }
    if (!EXT.has(path.extname(e.name))) continue;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    lines.forEach((ln, i) => {
      const m = ln.match(RE);
      if (m) viol.push({ f: norm(full), n: i + 1, key: (ln.match(/setItem\(\s*[`'"]([^`'"]+)/) || [])[1] || '?', ln: ln.trim() });
    });
  }
}
walk(ROOT);
if (viol.length) {
  console.error(`[check-localstorage-auth] FAIL — ${viol.length} auth token write(s) to web storage:`);
  for (const v of viol) console.error(`  ${v.f}:${v.n}  key='${v.key}'  ${v.ln}`);
  process.exit(1);
}
console.log('[check-localstorage-auth] OK');
