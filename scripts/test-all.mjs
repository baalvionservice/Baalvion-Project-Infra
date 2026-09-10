#!/usr/bin/env node
// Run EVERY workspace package's tests, whatever runner it uses.
//
// The gate used to run two selections: `pnpm --filter "./Backend/packages/*" run test`,
// and, for services, only those whose test script is literally `node --test` — jest and
// vitest services were "deliberately excluded until their runners are wired", and never
// were. The result: 213 test files across 13 packages never executed on any merge,
// including auth-service (19 files) and order-execution-service (46). Engineers wrote
// them; CI ignored them; a merge proved nothing about any of it.
//
// They were not excluded because they fail. auth-service runs 230 tests with 205
// passing — the only failures are ECONNREFUSED from tests that want the Postgres CI
// already starts for its RLS jobs.
//
// Discovery is by convention, same as the lint ratchet: a package with a real `test`
// script is tested. A new service is covered with no CI change.
//
//   node scripts/test-all.mjs             run everything, fail on any regression
//   node scripts/test-all.mjs --update    record the current pass/fail state
//   node scripts/test-all.mjs --filter X  only packages whose path contains X
//   node scripts/test-all.mjs --list      show what would run, run nothing

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const LIST = args.includes('--list');
const fi = args.indexOf('--filter');
const FILTER = fi > -1 ? args[fi + 1] : null;
const BASELINE = '.test-baseline.json';

const SKIP = new Set(['node_modules', 'dist', '.next', '.turbo', '.git', 'build', 'coverage']);
const PLACEHOLDER = /^\s*(echo|exit 0|true)\b|no test specified/i;

function discover(roots) {
  const found = [];
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
          const t = j.scripts?.test;
          if (j.name && t && !PLACEHOLDER.test(t)) found.push({ dir, name: j.name, script: t });
        } catch { /* unparseable manifest is someone else's problem */ }
      }
    }
  };
  roots.forEach((r) => existsSync(r) && walk(r, 0));
  return found.sort((a, b) => a.dir.localeCompare(b.dir));
}


// CI hands us the affected set (scripts/affected.mjs --dirs) so a one-line change to one
// of ~20 sites does not run all of them. The file is authoritative: affected.mjs already
// fails safe by returning everything when it cannot resolve the graph, so an empty file
// here genuinely means "this diff touches nothing we gate on".
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx > -1
  ? new Set(readFileSync(process.argv[onlyIdx + 1], 'utf8').split('\n').map((l) => l.trim()).filter(Boolean))
  : null;

const packages = discover(['Backend/packages', 'Backend/services', 'Frontend'])
  .filter((p) => !ONLY || ONLY.has(typeof p === "string" ? p : p.dir))
  .filter((p) => !FILTER || p.dir.includes(FILTER));

if (LIST) {
  console.log(`${packages.length} packages would run:\n`);
  for (const p of packages) console.log(`  ${p.dir.padEnd(52)} ${p.script}`);
  process.exit(0);
}

const results = {};
let failedNow = 0;

for (const p of packages) {
  const started = Date.now();
  // CI=true keeps watch-mode runners (vitest, jest --watch defaults) from hanging forever.
  const run = spawnSync('pnpm', ['run', '--silent', 'test'], {
    cwd: p.dir,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true' },
    timeout: 10 * 60 * 1000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const ok = run.status === 0;
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  results[p.dir] = ok ? 'pass' : 'fail';
  if (!ok) failedNow += 1;
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${p.dir.padEnd(52)} ${secs}s`);
  if (!ok && !UPDATE) {
    const out = `${run.stdout || ''}${run.stderr || ''}`.trim().split('\n').slice(-12);
    out.forEach((l) => console.log(`        ${l}`));
  }
}

if (UPDATE) {
  writeFileSync(BASELINE, `${JSON.stringify(results, null, 2)}\n`);
  const pass = Object.values(results).filter((v) => v === 'pass').length;
  console.log(`\nrecorded ${packages.length} packages — ${pass} passing, ${failedNow} failing -> ${BASELINE}`);
  process.exit(0);
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};
// A package with no baseline entry is new. New code is expected to pass — there is no
// debt to grandfather — so its expectation is 'pass', not "whatever it does today".
const regressed = Object.entries(results).filter(([dir, r]) => r === 'fail' && (baseline[dir] ?? 'pass') === 'pass');
const fixed = Object.entries(results).filter(([dir, r]) => r === 'pass' && baseline[dir] === 'fail');

for (const [dir] of fixed) console.log(`\nfixed: ${dir} now passes — run --update to hold it there.`);

if (regressed.length) {
  console.error(`\n${regressed.length} package(s) whose tests were passing now fail:\n`);
  regressed.forEach(([dir]) => console.error(`  ${dir}`));
  process.exit(1);
}

const known = Object.entries(results).filter(([, r]) => r === 'fail').length;
console.log(
  `\ntest gate ok — ${packages.length} packages run, ${packages.length - known} passing` +
    (known ? `, ${known} known-failing (frozen, cannot grow)` : '') +
    (fixed.length ? `, ${fixed.length} newly fixed` : '') + '.',
);
