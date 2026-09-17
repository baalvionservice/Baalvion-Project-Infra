#!/usr/bin/env node
// Root `pnpm.overrides` and the lockfile's `overrides:` block must agree, or every
// `pnpm install --frozen-lockfile` in CI dies with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH
// before it runs a single test.
//
// Dependabot drifts them apart on its own: it bumps the leaf package.json files and
// regenerates the lockfile (so the lockfile's overrides block moves), but it does not
// know the root pnpm.overrides block exists, so that half stays behind. Every
// Dependabot PR touching an overridden package lands red for a reason unrelated to
// the bump itself.
//
//   --fix   rewrite root package.json to match the lockfile (the lockfile is the
//           resolved truth — it is what pnpm actually installed)
//
// Exits non-zero on drift so CI can gate on it without a workspace install.

import { readFileSync, writeFileSync } from 'node:fs';

const FIX = process.argv.includes('--fix');
const PKG = 'package.json';
const LOCK = 'pnpm-lock.yaml';

const raw = readFileSync(PKG, 'utf8');
const pkg = JSON.parse(raw);
const declared = pkg.pnpm?.overrides ?? {};

// pnpm 10 moved `overrides` out of package.json's `pnpm` field and into
// pnpm-workspace.yaml. pnpm 9 reads ONLY the former; pnpm 10+ reads ONLY the
// latter and silently ignores the other — no error, no failed install, just 71
// security pins quietly not applying. `packageManager` is the only thing keeping
// this repo on the version that still reads them, so a routine pnpm bump would
// drop every pin at once. Refuse to let that happen quietly.
const pinned = /^pnpm@(\d+)\./.exec(pkg.packageManager ?? '')?.[1];
if (pinned && Number(pinned) >= 10 && Object.keys(declared).length > 0) {
  console.error(
    `packageManager is pnpm@${pinned}.x, which does NOT read pnpm.overrides from ${PKG} —\n` +
      `it reads an \`overrides:\` block in pnpm-workspace.yaml instead. The ` +
      `${Object.keys(declared).length} pins in ${PKG} (most of them security pins) would be\n` +
      `silently ignored.\n\nMove them to pnpm-workspace.yaml before raising the pnpm major.\n`,
  );
  process.exit(1);
}

// The lockfile is YAML, but the overrides block is a flat scalar map at column 2 and
// pulling in a YAML parser here would mean this check cannot run before an install.
const lock = readFileSync(LOCK, 'utf8');
const block = lock.match(/^overrides:\n((?:[ \t]+\S.*\n|\n)*)/m);

if (!block) {
  if (Object.keys(declared).length === 0) process.exit(0);
  console.error(
    `${LOCK} has no overrides block, but ${PKG} declares ${Object.keys(declared).length}.`,
  );
  console.error(`Run: pnpm install --lockfile-only`);
  process.exit(1);
}

const resolved = {};
for (const line of block[1].split('\n')) {
  // `  name: value` / `  'scoped@range': value` — quotes are pnpm's, not part of the key.
  const m = line.match(/^ {2}(?:'([^']+)'|"([^"]+)"|([^:]+)):\s*(.+?)\s*$/);
  if (!m) continue;
  const key = (m[1] ?? m[2] ?? m[3]).trim();
  resolved[key] = m[4].replace(/^['"]|['"]$/g, '');
}

const declaredKeys = Object.keys(declared);
const resolvedKeys = Object.keys(resolved);

const missing = declaredKeys.filter((k) => !(k in resolved));
const extra = resolvedKeys.filter((k) => !(k in declared));
const mismatched = declaredKeys
  .filter((k) => k in resolved && String(declared[k]) !== resolved[k])
  .map((k) => ({ key: k, pkg: String(declared[k]), lock: resolved[k] }));

const drifted = missing.length + extra.length + mismatched.length;

if (!drifted) {
  console.log(`overrides in sync — ${declaredKeys.length} pins agree across ${PKG} and ${LOCK}.`);
  process.exit(0);
}

if (FIX) {
  const next = { ...declared };
  for (const { key, lock: v } of mismatched) next[key] = v;
  for (const k of extra) next[k] = resolved[k];
  for (const k of missing) delete next[k];

  // Rewrite in place so the diff stays limited to the overrides block: reusing the
  // parsed object would reorder keys and reformat the whole file.
  pkg.pnpm = { ...pkg.pnpm, overrides: next };
  const indent = raw.match(/\n(\s+)"/)?.[1]?.length ?? 2;
  writeFileSync(PKG, `${JSON.stringify(pkg, null, indent)}\n`);

  for (const { key, pkg: a, lock: b } of mismatched) console.log(`  updated ${key}: ${a} -> ${b}`);
  for (const k of extra) console.log(`  added   ${k}: ${resolved[k]}`);
  for (const k of missing) console.log(`  removed ${k}`);
  console.log(`\n${PKG} now matches ${LOCK} (${drifted} change${drifted === 1 ? '' : 's'}).`);
  process.exit(0);
}

console.error(`pnpm overrides drifted between ${PKG} and ${LOCK}:\n`);
for (const { key, pkg: a, lock: b } of mismatched) {
  console.error(`  ${key}\n    package.json: ${a}\n    lockfile:     ${b}`);
}
for (const k of missing) console.error(`  ${k}\n    package.json: ${declared[k]}\n    lockfile:     (absent)`);
for (const k of extra) console.error(`  ${k}\n    package.json: (absent)\n    lockfile:     ${resolved[k]}`);

console.error(
  `\n${drifted} drifted pin${drifted === 1 ? '' : 's'}. Every \`pnpm install --frozen-lockfile\`` +
    ` will fail until they agree.\n\nFix with:  node scripts/check-lockfile-overrides.mjs --fix\n`,
);
process.exit(1);
