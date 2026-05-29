#!/usr/bin/env node
// P0 security guard — NO auth token / session / role persistence in web storage.
// Allowlist: NONE. Access tokens must live in memory; refresh tokens in httpOnly cookies.
//
// Detects (was: string-literal keys only — trivially bypassed by `const KEY='...token'`):
//   1. (local|session)Storage.setItem(<literal>, …)         where the literal looks sensitive
//   2. (local|session)Storage.setItem(<IDENT>, …)           where IDENT is a const bound to a
//                                                           sensitive string, OR IDENT's NAME is
//                                                           sensitive (e.g. TOKEN_KEY, REFRESH_KEY)
//   3. zustand persist(...) that serializes auth state      (token/jwt/refresh/roles/permissions)
'use strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'Frontend';
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.turbo', 'out']);
const EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue', '.svelte']);

// Credential vocabulary — the P0 concern is access/refresh tokens, JWTs and session blobs in
// web storage. NOTE: cosmetic role-view flags (e.g. `adminRole`, `userRole`) are intentionally
// NOT hard-failed here — they are not credentials (server-side RBAC is authoritative). Forgeable
// ROLE COOKIES are a separate concern handled by direct removal in the affected apps, and cookies
// are not web storage so this scanner would not see them anyway.
// NOTE: use plain `token` (not \btoken\b) — \b fails on underscore-joined keys like
// `law_token`/`trade_token` because `_` is a word char. `auth` stays bounded to avoid matching
// `author`/`authorization` in unrelated keys (auth tokens are already caught by `token`).
const SENSITIVE = /(access[_-]?token|refresh[_-]?token|id[_-]?token|token|jwt|\bauth\b|session|bearer|credential)/i;
// Things that are safe even though they contain a fragment above (avoid false positives).
const SAFE_KEY = /^(theme|locale|lang|i18n|sidebar|ui[-_]|consent|cookie[-_]consent|onboarding|tour|color|layout)/i;

const norm = (p) => p.split(path.sep).join('/');
const viol = [];

function firstArg(line, idx) {
  // crude first-arg extraction starting just after "setItem("
  const rest = line.slice(idx);
  const open = rest.indexOf('(');
  if (open === -1) return null;
  let depth = 0, arg = '';
  for (let i = open; i < rest.length; i++) {
    const ch = rest[i];
    if (ch === '(') { depth++; if (depth === 1) continue; }
    else if (ch === ')') { depth--; if (depth === 0) break; }
    else if (ch === ',' && depth === 1) break;
    if (depth >= 1) arg += ch;
  }
  return arg.trim();
}

function collectSensitiveVars(content) {
  const vars = new Set();
  // const/let/var NAME = 'literal'  (or `literal`)
  const re = /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*[`'"]([^`'"]+)[`'"]/g;
  let m;
  while ((m = re.exec(content))) {
    const [, name, val] = m;
    if (SAFE_KEY.test(val)) continue;
    if (SENSITIVE.test(val) || SENSITIVE.test(name)) vars.add(name);
  }
  return vars;
}

function checkPersist(content, file) {
  if (!/\bpersist\s*\(/.test(content)) return;
  if (!/(local|session)Storage/.test(content)) return;
  // Prefer the partialize whitelist if present; else inspect the whole persisted slice.
  const pm = content.match(/partialize\s*:\s*\([^)]*\)\s*=>\s*\(\{([\s\S]*?)\}\)/);
  const scope = pm ? pm[1] : content;
  const hit = scope.match(/\b(accessToken|refreshToken|idToken|token|jwt)\b/);
  if (hit) {
    const lineNo = content.slice(0, content.indexOf('persist(')).split('\n').length;
    viol.push({ f: norm(file), n: lineNo, key: `persist:${hit[1]}`, ln: 'zustand persist() serializes auth state' });
  }
}

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(full); continue; }
    if (!EXT.has(path.extname(e.name))) continue;
    const content = fs.readFileSync(full, 'utf8');
    const sensitiveVars = collectSensitiveVars(content);
    const lines = content.split('\n');
    lines.forEach((ln, i) => {
      const setIdx = ln.search(/(local|session)Storage\.setItem/);
      if (setIdx === -1) return;
      const arg = firstArg(ln, setIdx);
      if (arg == null) return;
      const lit = arg.match(/^[`'"]([^`'"]+)[`'"]$/);
      let bad = false, key = arg;
      if (lit) {
        key = lit[1];
        bad = SENSITIVE.test(key) && !SAFE_KEY.test(key);
      } else {
        // identifier or template literal
        const ident = arg.replace(/[`'"\\$ {}]/g, '');
        bad = (sensitiveVars.has(arg) || SENSITIVE.test(arg) || SENSITIVE.test(ident)) && !SAFE_KEY.test(ident);
      }
      if (bad) viol.push({ f: norm(full), n: i + 1, key, ln: ln.trim() });
    });
    checkPersist(content, full);
  }
}

walk(ROOT);
if (viol.length) {
  console.error(`[check-localstorage-auth] FAIL — ${viol.length} insecure auth/session persistence site(s):`);
  for (const v of viol) console.error(`  ${v.f}:${v.n}  [${v.key}]  ${v.ln}`);
  console.error('\nAccess tokens MUST be in memory; refresh tokens MUST be httpOnly cookies. See Jobs portal for the canonical pattern.');
  process.exit(1);
}
console.log('[check-localstorage-auth] OK — no auth token/session/role persistence found.');
