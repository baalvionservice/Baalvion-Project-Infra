#!/usr/bin/env node
// Which workspace packages can a diff actually have broken?
//
// A one-line change to one of ~20 sites currently costs 14 app builds, 26 lint runs
// and 62 test suites on every PR. That cost is why the pipeline used to lint two apps
// and scan eight images by name — someone was managing it with hardcoded lists, and the
// lists then silently stopped covering new work.
//
// Turbo already knows the dependency graph, so ask it instead of guessing:
// `--filter='...[<base>]'` selects everything changed plus everything that DEPENDS on
// what changed. Verified against this repo: one app -> 1 package; a change to
// @baalvion/design -> 23 (itself plus all 22 consumers).
//
// FAIL SAFE. Every uncertain path returns the full set, never an empty one. Skipping a
// package that should have been built is a broken merge; rebuilding everything is only
// slow. In particular an unknown base ref, a shallow clone, or any turbo error means
// "run everything".
//
//   node scripts/affected.mjs --base origin/main            names, one per line
//   node scripts/affected.mjs --base origin/main --dirs     workspace directories
//   node scripts/affected.mjs --base origin/main --matrix   {"include":[…]} for Actions
//   node scripts/affected.mjs --base origin/main --count    "<n>/<total>"
//   node scripts/affected.mjs --all                         force the full set

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : null; };
const BASE = opt('base');
const FORCE_ALL = args.includes('--all');

const SKIP = new Set(['node_modules', 'dist', '.next', '.turbo', '.git', 'build', 'coverage']);

/** Every workspace package: name -> directory. */
function allPackages() {
  const out = new Map();
  const walk = (dir, depth) => {
    if (depth > 4) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name === 'package.json') {
        try {
          const j = JSON.parse(readFileSync(p, 'utf8'));
          if (j.name) out.set(j.name, dir);
        } catch { /* unparseable manifest is someone else's problem */ }
      }
    }
  };
  ['Backend/packages', 'Backend/services', 'Frontend'].forEach((r) => existsSync(r) && walk(r, 0));
  return out;
}

const packages = allPackages();

function affectedNames() {
  if (FORCE_ALL || !BASE) return [...packages.keys()];
  // The base must be a ref this clone actually has — a shallow checkout will not.
  try {
    execFileSync('git', ['rev-parse', '--verify', `${BASE}^{commit}`], { stdio: 'ignore' });
  } catch {
    console.error(`affected: base ref '${BASE}' is not present in this clone — selecting ALL packages.`);
    return [...packages.keys()];
  }
  let raw;
  try {
    raw = execFileSync(
      'pnpm',
      ['exec', 'turbo', 'run', 'build', `--filter=...[${BASE}]`, '--dry=json'],
      { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch {
    console.error('affected: turbo could not resolve the graph — selecting ALL packages.');
    return [...packages.keys()];
  }
  try {
    const sel = JSON.parse(raw).packages ?? [];
    // An empty selection is legitimate (a docs-only diff). Callers skip cleanly on it.
    return sel.filter((n) => packages.has(n));
  } catch {
    console.error('affected: turbo output was not JSON — selecting ALL packages.');
    return [...packages.keys()];
  }
}

const names = affectedNames();

if (args.includes('--matrix')) {
  console.log(JSON.stringify({
    include: names.map((n) => ({ name: n, dir: packages.get(n) })),
  }));
} else if (args.includes('--dirs')) {
  names.map((n) => packages.get(n)).sort().forEach((d) => console.log(d));
} else if (args.includes('--count')) {
  console.log(`${names.length}/${packages.size}`);
} else {
  names.sort().forEach((n) => console.log(n));
}
