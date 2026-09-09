#!/usr/bin/env node
// git merge driver for pnpm-lock.yaml.
//
// 99 of the last 200 commits on this repo touched pnpm-lock.yaml — a ~40k-line
// generated file. Git's default three-way text merge conflicts on it constantly,
// and hand-resolving a resolution graph is both miserable and unsafe: a
// plausible-looking manual merge can silently pin a version nobody chose.
//
// The lockfile is generated, so it should never be merged textually. This driver
// throws away the textual conflict, takes OUR side as a starting point, and asks
// pnpm to re-resolve it against the already-merged package.json files. Whatever
// pnpm produces is correct by construction.
//
// Wired up by scripts/setup-git.mjs (run automatically from the root `prepare`
// script) together with the `merge=pnpm-lock` attribute in .gitattributes.
//
// Invoked by git as: merge-pnpm-lock.mjs %A %O %B %P
//   %A  current/ours   (also the file the result must be written to)
//   %O  ancestor
//   %B  other/theirs
//   %P  the real pathname the result lands at

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const [ours, , theirs, pathname = 'pnpm-lock.yaml'] = process.argv.slice(2);

if (!ours || !existsSync(ours)) {
  console.error('merge-pnpm-lock: no "ours" version supplied; leaving the conflict for git.');
  process.exit(1);
}

const target = pathname;
const backup = readFileSync(target, 'utf8');

try {
  // Start from ours. Either side works — pnpm re-resolves from the manifests, not
  // from the lockfile content — but ours keeps the diff smaller for the common
  // case where a branch touched very little.
  copyFileSync(ours, target);

  execFileSync('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], {
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf8',
  });

  copyFileSync(target, ours);
  console.error(`merge-pnpm-lock: re-resolved ${target} from the merged manifests.`);
  process.exit(0);
} catch (err) {
  // Put the file back exactly as found and hand the conflict to git rather than
  // leaving a half-resolved lockfile behind.
  writeFileSync(target, backup);
  const detail = (err.stderr || err.message || '').toString().trim().split('\n').slice(-3).join('\n');
  console.error(
    `merge-pnpm-lock: pnpm could not re-resolve the lockfile, so this is a real ` +
      `manifest conflict, not a lockfile one. Resolve the package.json files first, then run ` +
      `\`pnpm install --lockfile-only\`.\n${detail}`,
  );
  // A theirs-side copy is left for inspection; git will mark the path conflicted.
  if (theirs && existsSync(theirs)) console.error(`  their lockfile: ${theirs}`);
  process.exit(1);
}
