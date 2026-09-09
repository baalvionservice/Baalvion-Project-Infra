#!/usr/bin/env node
// Per-clone git wiring. Runs from the root `prepare` script, so a fresh clone
// picks it up on the first `pnpm install`.
//
// Both settings live in .git/config, which is per-clone and cannot be committed —
// hence this script rather than a checked-in config file.
//
//   core.hooksPath          -> .githooks (the pre-commit guard)
//   merge.pnpm-lock.driver  -> the generated-file merge driver, paired with the
//                              `pnpm-lock.yaml merge=pnpm-lock` line in .gitattributes
//
// Never fails the install: a missing git binary, a tarball checkout with no .git,
// or a CI runner that does not need hooks should all install normally.

import { execFileSync } from 'node:child_process';

const settings = [
  ['core.hooksPath', '.githooks'],
  ['merge.pnpm-lock.name', 'regenerate pnpm-lock.yaml from the merged manifests'],
  ['merge.pnpm-lock.driver', 'node scripts/merge-pnpm-lock.mjs %A %O %B %P'],
];

try {
  execFileSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' });
} catch {
  process.exit(0); // not a git checkout — nothing to wire
}

// CI clones fresh every run and commits nothing; hooks there are pure overhead.
if (process.env.CI) process.exit(0);

let applied = 0;
for (const [key, value] of settings) {
  try {
    const current = execFileSync('git', ['config', '--local', '--get', key], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (current === value) continue;
  } catch {
    // unset — fall through and set it
  }
  try {
    execFileSync('git', ['config', '--local', key, value], { stdio: 'ignore' });
    applied += 1;
  } catch {
    // A read-only or unusual git setup should not break `pnpm install`.
  }
}

if (applied) {
  console.log(`git: wired ${applied} local setting${applied === 1 ? '' : 's'} (hooks + lockfile merge driver).`);
}
