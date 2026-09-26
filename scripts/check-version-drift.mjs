#!/usr/bin/env node
// The shared runtime layer (Node, pnpm, Turbo) is supposed to be identical everywhere —
// unlike per-product dependencies, which are meant to drift independently per service.
// versions.json is the one place that layer is declared; this script proves every
// Dockerfile, .nvmrc, and root package.json still agrees with it.
//
// Modes:
//   (default)  report drift, exit 0 — safe to run today even with existing drift
//   --strict   same report, but exit 1 if any drift is found (use once migrated)
//   --fix      rewrite Dockerfiles / .nvmrc to match versions.json exactly
//
// A floating tag (`node:26-alpine`, no patch) is reported as drift even against
// itself: an unpinned tag means the image changes underneath you on every rebuild
// with no diff to review, which is the actual danger this script exists to catch.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const FIX = process.argv.includes('--fix');
const STRICT = process.argv.includes('--strict');
const ROOT = process.cwd();

const versions = JSON.parse(readFileSync(join(ROOT, 'versions.json'), 'utf8'));
const canonicalNode = versions.node.canonical; // e.g. "26.9-alpine"
const canonicalPnpm = versions.pnpm;
const canonicalTurbo = versions.turbo;

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next']);

function findDockerfiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) findDockerfiles(full, out);
    else if (entry === 'Dockerfile') out.push(full);
  }
  return out;
}

// Real source roots only — editor/agent worktree dirs (.claude, .kilo, ...) are
// excluded above via the leading-dot skip, but walk explicitly anyway so a future
// tool that scratches a non-dot directory at the repo root can't sneak in.
const SOURCE_ROOTS = ['Backend', 'Frontend', 'deploy', 'docker'];
const dockerfiles = SOURCE_ROOTS.flatMap((r) => findDockerfiles(join(ROOT, r)));
const findings = [];

for (const path of dockerfiles) {
  const rel = relative(ROOT, path);
  let text = readFileSync(path, 'utf8');
  let changed = false;

  // Only Dockerfiles that actually build a Node image are in scope — e.g. the
  // Imperialpedia legacy Dockerfile is FROM php:8.2-apache and is not this script's business.
  const nodeFromRe = /^FROM node:([A-Za-z0-9.-]+)(.*)$/gm;
  let m;
  const nodeMatches = [];
  while ((m = nodeFromRe.exec(text))) nodeMatches.push(m);
  if (nodeMatches.length === 0) continue;

  for (const match of nodeMatches) {
    const tag = match[1];
    if (tag !== canonicalNode) {
      findings.push({ file: rel, kind: 'node-base-image', found: tag, expected: canonicalNode });
      if (FIX) {
        text = text.replace(`FROM node:${tag}${match[2]}`, `FROM node:${canonicalNode}${match[2]}`);
        changed = true;
      }
    }
  }

  const turboRe = /turbo@([0-9.]+)/g;
  const turboMatches = [...text.matchAll(turboRe)];
  for (const [, tag] of turboMatches) {
    if (tag !== canonicalTurbo) {
      findings.push({ file: rel, kind: 'turbo-pin', found: tag, expected: canonicalTurbo });
      if (FIX) {
        text = text.replaceAll(`turbo@${tag}`, `turbo@${canonicalTurbo}`);
        changed = true;
      }
    }
  }

  // An UNPINNED `npx turbo` / `pnpm dlx turbo` (no `@version`) is the same floating-tag
  // danger as `node:26-alpine` — it resolves whatever's newest on every rebuild. Caught
  // live: 4 Dockerfiles on bare `npx turbo prune` broke the instant npx resolved turbo
  // 2.11.4 instead of the 2.9.16 every pinned Dockerfile uses, with no file changed to
  // explain it. `(?!@)` excludes the already-pinned form matched above.
  const unpinnedTurboRe = /\b(npx turbo|pnpm dlx turbo)(?!@)\b/g;
  const unpinnedMatches = [...text.matchAll(unpinnedTurboRe)];
  for (const [, invocation] of unpinnedMatches) {
    findings.push({ file: rel, kind: 'turbo-unpinned', found: invocation, expected: `${invocation}@${canonicalTurbo}` });
    if (FIX) {
      text = text.replaceAll(invocation, `${invocation}@${canonicalTurbo}`);
      changed = true;
    }
  }

  if (changed) writeFileSync(path, text);
}

// .nvmrc
const nvmrcPath = join(ROOT, '.nvmrc');
const nvmrc = readFileSync(nvmrcPath, 'utf8').trim();
const canonicalNodeMajor = canonicalNode.split('.')[0].split('-')[0];
if (nvmrc !== canonicalNodeMajor) {
  findings.push({ file: '.nvmrc', kind: 'nvmrc', found: nvmrc, expected: canonicalNodeMajor });
  if (FIX) writeFileSync(nvmrcPath, `${canonicalNodeMajor}\n`);
}

// root package.json packageManager
const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const pmVersion = /^pnpm@(.+)$/.exec(pkg.packageManager ?? '')?.[1];
if (pmVersion !== canonicalPnpm) {
  findings.push({ file: 'package.json', kind: 'packageManager', found: pmVersion, expected: canonicalPnpm });
}

// root package.json turbo devDependency (range, so compare the version it would resolve to
// only loosely — flag if the canonical version doesn't satisfy the declared range's floor)
const turboDep = pkg.devDependencies?.turbo;
if (turboDep && !turboDep.replace(/^[\^~]/, '').startsWith(canonicalTurbo.split('.').slice(0, 2).join('.'))) {
  findings.push({ file: 'package.json', kind: 'turbo-devDependency', found: turboDep, expected: canonicalTurbo });
}

if (findings.length === 0) {
  console.log(`No drift — every Dockerfile, .nvmrc, and package.json matches versions.json.`);
  process.exit(0);
}

const byKind = {};
for (const f of findings) (byKind[f.kind] ??= []).push(f);

console.log(`${findings.length} version-drift finding(s) against versions.json:\n`);
for (const [kind, list] of Object.entries(byKind)) {
  console.log(`  ${kind} (${list.length}):`);
  const preview = list.slice(0, 5);
  for (const f of preview) console.log(`    ${f.file}: found ${f.found}, expected ${f.expected}`);
  if (list.length > preview.length) console.log(`    ... and ${list.length - preview.length} more`);
}

if (FIX) {
  console.log(`\nRewrote drifted files to match versions.json. Review the diff before committing.`);
  process.exit(0);
}

console.log(`\nFix with:  node scripts/check-version-drift.mjs --fix`);
process.exit(STRICT ? 1 : 0);
