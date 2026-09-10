#!/usr/bin/env node
// Lint every workspace package that has a lint script, and fail only where the
// error count went UP against the recorded baseline.
//
// Why a ratchet rather than an allow-list. CI used to lint two of twenty-five apps
// by name (`--filter=proxy-baalvionstack-web --filter=baalvion-admin-platform`).
// A hardcoded list has to be edited for every new app, so in practice it never is —
// thirteen apps had no ESLint config at all and nobody noticed, because `next lint`
// silently supplied defaults and nothing else ever ran.
//
// Discovery is by convention: a package.json with a `lint` script is linted. A new
// app is picked up with no CI change, starts at a baseline of zero, and can never
// introduce an error. Existing debt is frozen and can only shrink — when it does,
// --update writes the lower number back, so the floor keeps dropping and can never
// rise again.
//
//   node scripts/lint-ratchet.mjs            check against the baseline (CI)
//   node scripts/lint-ratchet.mjs --update   record current counts (after fixing)
//   node scripts/lint-ratchet.mjs --filter X only packages whose path contains X

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const UPDATE = process.argv.includes('--update');
const filterIdx = process.argv.indexOf('--filter');
const FILTER = filterIdx > -1 ? process.argv[filterIdx + 1] : null;
const BASELINE = '.lint-baseline.json';

const SKIP = new Set(['node_modules', 'dist', '.next', '.turbo', '.git', 'build', 'coverage', 'out']);

/** Every workspace package that opts into linting by having a `lint` script. */
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
          if (j.scripts?.lint) found.push(dir);
        } catch { /* unparseable manifest is someone else's problem */ }
      }
    }
  };
  roots.forEach((r) => existsSync(r) && walk(r, 0));
  return [...new Set(found)].sort();
}

/** Error count for one package, or null if ESLint could not run at all. */
function lintErrors(pkgDir) {
  const bin = path.resolve('node_modules/.bin/eslint');
  if (!existsSync(bin)) throw new Error('eslint not installed at the workspace root — run pnpm install');
  let out;
  try {
    out = execFileSync(bin, ['.', '-f', 'json'], { cwd: pkgDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  } catch (err) {
    // ESLint exits non-zero when it reports errors; that is a normal result, and the
    // JSON is still on stdout. Only a missing/!JSON stdout means it truly crashed.
    out = err.stdout;
    if (!out) return null;
  }
  try {
    const results = JSON.parse(out);
    return {
      errors: results.reduce((n, f) => n + f.errorCount, 0),
      warnings: results.reduce((n, f) => n + f.warningCount, 0),
    };
  } catch { return null; }
}


// CI hands us the affected set (scripts/affected.mjs --dirs) so a one-line change to one
// of ~20 sites does not run all of them. The file is authoritative: affected.mjs already
// fails safe by returning everything when it cannot resolve the graph, so an empty file
// here genuinely means "this diff touches nothing we gate on".
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx > -1
  ? new Set(readFileSync(process.argv[onlyIdx + 1], 'utf8').split('\n').map((l) => l.trim()).filter(Boolean))
  : null;

const packages = discover(['Frontend', 'Backend/packages', 'Backend/services'])
  .filter((p) => !ONLY || ONLY.has(typeof p === "string" ? p : p.dir))
  .filter((p) => !FILTER || p.includes(FILTER));

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};
const next = {};
const regressed = [];
const improved = [];
const broken = [];

for (const pkg of packages) {
  const res = lintErrors(pkg);
  if (res === null) { broken.push(pkg); continue; }
  next[pkg] = res.errors;

  // A package with no recorded baseline is new. New code starts clean — there is no
  // debt to grandfather — so its floor is zero, not "whatever it happens to have".
  const floor = baseline[pkg] ?? 0;
  if (res.errors > floor) regressed.push({ pkg, was: floor, now: res.errors, warnings: res.warnings });
  else if (res.errors < floor) improved.push({ pkg, was: floor, now: res.errors });
}

if (UPDATE) {
  writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`);
  const total = Object.values(next).reduce((a, b) => a + b, 0);
  console.log(`recorded ${Object.keys(next).length} packages, ${total} errors total -> ${BASELINE}`);
  if (broken.length) console.log(`\nESLint could not run in:\n${broken.map((p) => `  ${p}`).join('\n')}`);
  process.exit(broken.length ? 1 : 0);
}

for (const { pkg, was, now } of improved) console.log(`improved  ${pkg}: ${was} -> ${now}`);

if (broken.length) {
  console.error(`\nESLint could not run at all in ${broken.length} package(s):`);
  broken.forEach((p) => console.error(`  ${p}`));
}

if (regressed.length) {
  console.error(`\n${regressed.length} package(s) gained lint errors:\n`);
  for (const { pkg, was, now, warnings } of regressed) {
    console.error(`  ${pkg}\n    errors ${was} -> ${now}   (${warnings} warnings)`);
  }
  console.error(
    `\nFix the new errors, or if you genuinely lowered another package's count, run:\n` +
      `  node scripts/lint-ratchet.mjs --update\n`,
  );
  process.exit(1);
}

if (broken.length) process.exit(1);

const total = Object.values(next).reduce((a, b) => a + b, 0);
console.log(
  `lint ratchet ok — ${Object.keys(next).length} packages, ${total} known errors, none new.` +
    (improved.length ? ` ${improved.length} improved: run --update to lower the floor.` : ''),
);
