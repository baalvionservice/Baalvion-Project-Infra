#!/usr/bin/env node
// Phase 10 CI guard — no direct `jsonwebtoken` outside sanctioned modules.
// Sanctioned: auth-service, oauth-service, admin-service impersonation, packages/auth-node.
'use strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || '.';
const ALLOW = [
  'Backend/services/identity/auth-service',
  'Backend/services/identity/oauth-service',
  'Backend/services/platform/admin-service/service/adminService.js', // sanctioned impersonation issuer
  'Backend/packages/auth-node',
];
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.turbo']);
const EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);
const RE = /require\(\s*['"]jsonwebtoken['"]|from\s+['"]jsonwebtoken['"]|import\(\s*['"]jsonwebtoken['"]/;
const norm = (p) => p.split(path.sep).join('/');
const allowed = (f) => ALLOW.some((a) => norm(f).includes(a));

const viol = [];
function walk(dir) {
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(full); continue; }
    if (!EXT.has(path.extname(e.name)) || allowed(full)) continue;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    lines.forEach((ln, i) => { if (RE.test(ln)) viol.push({ f: norm(full), n: i + 1, ln: ln.trim() }); });
  }
}
walk(ROOT);
if (viol.length) {
  console.error(`[check-jwt-imports] FAIL — ${viol.length} direct jsonwebtoken usage(s) outside sanctioned modules:`);
  for (const v of viol) console.error(`  ${v.f}:${v.n}: ${v.ln}\n      -> replace with @baalvion/auth-node`);
  process.exit(1);
}
console.log('[check-jwt-imports] OK');
