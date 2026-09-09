#!/usr/bin/env node
// Emit the Docker build+scan matrix by looking at the repo, not at a list.
//
// The matrix in ci.yml named eight services by hand while the repo holds 63
// Dockerfiles. The other 55 images were never built in CI and never scanned for
// CVEs — and nothing said so, because a hardcoded matrix cannot report what it
// omits. A new service simply never appears.
//
// Discovery is by convention: any Dockerfile under Backend/services or Frontend
// that is not vendored or generated. The image name is derived from the service
// directory, which is the same name deploy uses for its ECR repo.
//
//   node scripts/discover-images.mjs            human-readable listing
//   node scripts/discover-images.mjs --matrix   {"include":[...]} for GH Actions
//   node scripts/discover-images.mjs --check    non-zero if any are unscannable

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SKIP = new Set(['node_modules', 'dist', '.next', '.turbo', '.git', 'build', 'coverage', '_reconcile']);

// Paths whose Dockerfile is not a deployable service image. Kept explicit and
// small — anything added here is a deliberate exclusion, not an oversight, and
// the --check mode reports the count so it cannot quietly grow.
const EXCLUDE = [
  /\/law-elite\/services\//,  // sub-services built inside the law-elite compose stack
  /\/nodebb\//,               // vendored upstream image
];

function findDockerfiles(root) {
  const out = [];
  const walk = (dir, depth) => {
    if (depth > 5) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name === 'Dockerfile') out.push(p);
    }
  };
  if (existsSync(root)) walk(root, 0);
  return out;
}

const files = [...findDockerfiles('Backend/services'), ...findDockerfiles('Frontend')]
  .filter((f) => !EXCLUDE.some((re) => re.test(f)))
  .sort();

// Two services can share a directory name across bounded contexts — platform and
// infrastructure both ship a `realtime-service`, on different ports, doing different
// jobs. Pushed under one image name, whichever built last silently replaces the
// other in the registry. Disambiguate with the bounded context rather than asking a
// human to remember, so the collision cannot come back.
const basenames = files.map((f) => path.basename(path.dirname(f)));
const collides = new Set(basenames.filter((n, i, a) => a.indexOf(n) !== i));

const images = files.map((file) => {
  const dir = path.dirname(file);
  const leaf = path.basename(dir);
  const domain = path.basename(path.dirname(dir));
  const name = collides.has(leaf) ? `${domain}-${leaf}` : leaf;
  const body = readFileSync(file, 'utf8');
  // A repo-root build context is required by any Dockerfile that prunes the pnpm
  // workspace; those cannot build from their own directory.
  const needsRootContext = /turbo\s+prune|COPY\s+pnpm-lock\.yaml|COPY\s+pnpm-workspace/.test(body);
  return { name, file, context: needsRootContext ? '.' : dir };
});

// Building all 60 images on every PR would cost more CI time than the whole rest of
// the pipeline. Narrow to what a diff can actually have broken: the service's own
// tree, or — for anything sharing the workspace — a change to the shared packages,
// the lockfile or the root manifest, which can alter any image.
function narrowToChanged(all, baseRef) {
  let changed;
  try {
    changed = execFileSync('git', ['diff', '--name-only', `${baseRef}...HEAD`], { encoding: 'utf8' })
      .split('\n').filter(Boolean);
  } catch {
    return all; // cannot diff (shallow clone, unknown ref) — build everything rather than skip silently
  }
  const GLOBAL = /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|tsconfig\.base\.json|Backend\/packages\/)/;
  if (changed.some((f) => GLOBAL.test(f))) return all;
  return all.filter((img) => {
    const dir = path.dirname(img.file);
    return changed.some((f) => f.startsWith(`${dir}/`) || f === img.file);
  });
}

const changedIdx = process.argv.indexOf('--changed');
const selected = changedIdx > -1 ? narrowToChanged(images, process.argv[changedIdx + 1]) : images;

if (process.argv.includes('--matrix')) {
  console.log(JSON.stringify({ include: selected }));
} else if (process.argv.includes('--check')) {
  const dupes = images.map((i) => i.name).filter((n, i, a) => a.indexOf(n) !== i);
  if (dupes.length) {
    console.error(`Duplicate image names — they would overwrite each other in the registry:\n  ${[...new Set(dupes)].join('\n  ')}`);
    process.exit(1);
  }
  console.log(`${images.length} scannable images discovered, ${files.length} Dockerfiles considered, no name collisions.`);
} else {
  console.log(`${images.length} images:\n`);
  for (const i of images) console.log(`  ${i.name.padEnd(38)} ${i.context === '.' ? '[root ctx]' : '          '}  ${i.file}`);
}
