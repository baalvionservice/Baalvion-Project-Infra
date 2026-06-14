#!/usr/bin/env node
// Phase 10 CI guard — all services verify via @baalvion/auth-node; no legacy verifiers.
// Flags: utils/jwtserver.js files, legacy claim readers (decoded.id/orgId/sessionId), and
// handwritten jwt.verify-based middleware. Sanctioned issuers/verifier are allowlisted.
'use strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'Backend/services';
const ALLOW = [
  'Backend/packages/auth-node',
  'Backend/services/identity/auth-service',    // canonical issuer + its own verifier
  'Backend/services/identity/oauth-service',   // sanctioned OIDC provider
];
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.turbo']);
const EXT = new Set(['.js', '.mjs', '.cjs', '.ts']);
const norm = (p) => p.split(path.sep).join('/');
const allowed = (f) => ALLOW.some((a) => norm(f).includes(a));

const viol = [];
function walk(dir) {
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(full); continue; }
    if (!EXT.has(path.extname(e.name)) || allowed(full)) continue;
    const nf = norm(full);
    // legacy local verifier module
    if (/\/utils\/jwtserver\.js$/.test(nf)) { viol.push({ f: nf, n: 0, msg: 'legacy utils/jwtserver.js (local verifier/issuer)' }); }
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    lines.forEach((ln, i) => {
      if (/\bdecoded\.(id|orgId|sessionId)\b/.test(ln)) viol.push({ f: nf, n: i + 1, msg: 'legacy claim reader decoded.id/orgId/sessionId', ln: ln.trim() });
      if (/(?:^|[^.\w])(?:jwtserver\.verifyAccessToken|jwt\.verify\s*\([^)]*\)\s*;?\s*$)/.test(ln) && /middleware/i.test(nf)) viol.push({ f: nf, n: i + 1, msg: 'handwritten verify in middleware', ln: ln.trim() });
    });
  }
}
walk(ROOT);
if (viol.length) {
  console.error(`[check-auth-middleware] FAIL — ${viol.length} legacy auth construct(s):`);
  for (const v of viol) console.error(`  ${v.f}${v.n ? ':' + v.n : ''}: ${v.msg}${v.ln ? '\n      ' + v.ln : ''}\n      -> use @baalvion/auth-node createAuthMiddleware()`);
  process.exit(1);
}
console.log('[check-auth-middleware] OK');
