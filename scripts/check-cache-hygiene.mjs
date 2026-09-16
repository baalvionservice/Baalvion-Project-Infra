#!/usr/bin/env node
/**
 * Cache-hygiene guard for the Next.js frontends.
 *
 * In September 2026 three sites (imperialpedia, law-elite-network, amarise)
 * blew past Vercel's free tier — 16h of Fluid Active CPU against a 4h
 * allowance, 616k ISR writes against 200k — with a combined 76 live articles
 * between them. None of it was traffic. It was four caching mistakes, and the
 * thing they share is that NONE of them is visible where you make them:
 *
 *   1. A short `next: { revalidate: N }` in a shared fetcher silently becomes
 *      the ISR window of every route that reaches it. Next takes a route's
 *      window from its LOWEST fetch, overriding that route's own
 *      `export const revalidate` with no warning. A `300` in one CMS client
 *      had 155 routes regenerating every five minutes.
 *   2. `cache: 'no-store'` anywhere in a render tree — inside a <Suspense>
 *      boundary included, without PPR — makes the whole route dynamic. One
 *      no-store in a sidebar widget uncached every article on a site.
 *   3. A dynamic API (`headers()`, `cookies()`, `draftMode()`) in a ROOT
 *      layout does that to every route in the app at once. One `headers()`
 *      call meant 61 of 63 routes were dynamic and nothing was ever cached.
 *   4. A short `export const revalidate` on a page.
 *
 * Every one is a one-line change in a file far from the pages it breaks, which
 * is why code review kept missing them — this bug class had already been found
 * and fixed once before it came back through three different modules.
 *
 * So this checks the sources rather than a build artifact: it is deterministic,
 * needs no build, and cannot quietly start passing because a build-output
 * format changed. Known-good exceptions are listed per app in ALLOW below, each
 * with the reason it is safe — a new violation fails, a deliberate one is
 * written down.
 *
 * Usage:  node scripts/check-cache-hygiene.mjs [app-dir ...]
 *         (no args = every app in APPS)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

/**
 * Anything below this is treated as a mistake unless it is in ALLOW. It is
 * deliberately well above the windows these sites actually need: real freshness
 * comes from /api/revalidate's revalidateTag() on publish, so a short window
 * buys nothing and costs a regeneration per page per window.
 */
const MIN_REVALIDATE_SECONDS = 900;

const APPS = [
  'Frontend/Imperialpedia-main',
  'Frontend/Law-Elite-Network-main',
  'Frontend/AmariseMaisonAvenue-main',
];

/**
 * Deliberate exceptions, keyed by `<app>/<path>`. A bare path exempts the whole
 * file; `path:rule` exempts one rule in it. Add to this list only with a reason
 * that says why the cost is worth it — the point is that each one is a decision
 * somebody made, not a thing that slipped through.
 */
const ALLOW = {
  // Per-creator dashboard reads. These routes are user-scoped and dynamic by
  // design; they are not reachable from any cached page.
  'Frontend/Imperialpedia-main/src/services/data/creators-service.ts': 'no-store',
  // Search runs in a route handler, not a render tree, so it cannot make a page
  // dynamic.
  'Frontend/Imperialpedia-main/src/services/data/search-service.ts': 'no-store',
  // Google News wants a fresh sitemap; one route on a short window is fine.
  'Frontend/Imperialpedia-main/src/app/news-sitemap.xml/route.ts': 'segment-revalidate',
  'Frontend/AmariseMaisonAvenue-main/src/app/news-sitemap.xml/route.ts': 'segment-revalidate',
  // Opt-in only: `revalidate: false` is passed explicitly by the draft-preview
  // caller, and preview is confined to /article/:slug*, which is dynamic anyway.
  'Frontend/Law-Elite-Network-main/src/lib/cms.ts': 'no-store',
  // Live visitor presence, read from a client component — never server-rendered.
  'Frontend/AmariseMaisonAvenue-main/src/lib/presence.ts': 'no-store',
  // Both consumers (useMarkets.ts, store.tsx) are "use client", so this runs in
  // the browser where `next: { revalidate }` is inert — no route inherits it.
  // Confirmed against the build: no Amarisé route carries a 5m window except the
  // news sitemap. If a server component ever imports this, drop the exemption.
  'Frontend/AmariseMaisonAvenue-main/src/lib/markets.ts': 'revalidate-constant',
  // Storefront pricing and stock. 60s is a deliberate commerce-freshness call;
  // it bounds the two catalog routes and nothing else.
  'Frontend/AmariseMaisonAvenue-main/src/lib/catalog.ts': 'fetch-revalidate',
};

const violations = [];
const note = (file, line, rule, message) =>
  violations.push({ file, line, rule, message });

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** A match inside a comment is documentation, not code — several of these files
 *  explain the very mistake this script looks for. */
const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

const allowed = (relPath, rule) => {
  const entry = ALLOW[relPath];
  return entry === rule || entry === true;
};

function checkFile(absPath) {
  const relPath = relative(ROOT, absPath);
  const text = readFileSync(absPath, 'utf8');
  const lines = text.split('\n');

  // What makes a dynamic API catastrophic is being in the ROOT of the tree, and
  // the signal for that is rendering <html> — not the filename. Amarisé's shell
  // lives in _shell/root-html.tsx, so keying on `layout.tsx` would have missed
  // the exact call that made all 61 of its routes dynamic. `src/app/layout.tsx`
  // counts too, even when it delegates the <html> to a shared component.
  const isRootShell =
    /<html[\s>]/.test(text) || /\/src\/app\/layout\.tsx$/.test(absPath);

  lines.forEach((line, i) => {
    const n = i + 1;
    if (isComment(line)) return;

    if (/cache:\s*['"]no-store['"]/.test(line) && !allowed(relPath, 'no-store')) {
      note(relPath, n, 'no-store',
        "`cache: 'no-store'` makes every route that reaches this fully dynamic — " +
        'inside a <Suspense> boundary too. Use `next: { revalidate, tags }` instead.');
    }

    const fetchWindow = line.match(/next:\s*\{[^}]*revalidate:\s*(\d+)/);
    if (fetchWindow && Number(fetchWindow[1]) < MIN_REVALIDATE_SECONDS
        && !allowed(relPath, 'fetch-revalidate')) {
      note(relPath, n, 'fetch-revalidate',
        `revalidate: ${fetchWindow[1]}s becomes the ISR window of EVERY route that ` +
        `reaches this fetcher (Next uses the lowest). Minimum is ${MIN_REVALIDATE_SECONDS}s; ` +
        'let revalidateTag() in /api/revalidate handle freshness.');
    }

    // The window is almost never written inline where it is used — every real
    // instance of this bug so far was a named constant (`CMS_FETCH_REVALIDATE_
    // SECONDS = 300`) referenced from the fetch, so matching only the literal
    // form would have caught none of them.
    const constWindow = line.match(
      /(?:export\s+)?const\s+(\w*REVALIDATE\w*)\s*(?::\s*number\s*)?=\s*(\d+)\s*;/i,
    );
    // `export const revalidate` is the route segment config, not a fetch window —
    // it has its own rule (and its own ALLOW key) below.
    if (constWindow && constWindow[1].toLowerCase() !== 'revalidate'
        && Number(constWindow[2]) < MIN_REVALIDATE_SECONDS
        && !allowed(relPath, 'revalidate-constant')) {
      note(relPath, n, 'revalidate-constant',
        `${constWindow[1]} = ${constWindow[2]}s. If any fetch uses this, it becomes the ` +
        'ISR window of every route reaching that fetch (Next uses the lowest). Minimum is ' +
        `${MIN_REVALIDATE_SECONDS}s.`);
    }

    const segmentWindow = line.match(/export\s+const\s+revalidate\s*=\s*(\d+)/);
    if (segmentWindow && Number(segmentWindow[1]) < MIN_REVALIDATE_SECONDS
        && !allowed(relPath, 'segment-revalidate')) {
      note(relPath, n, 'segment-revalidate',
        `revalidate = ${segmentWindow[1]}s regenerates this route ` +
        `${Math.round(86400 / Number(segmentWindow[1]))}x a day. Minimum is ` +
        `${MIN_REVALIDATE_SECONDS}s.`);
    }

    if (isRootShell && !allowed(relPath, 'root-layout-dynamic')) {
      const api = line.match(/\b(headers|cookies|draftMode)\s*\(\s*\)/);
      if (api) {
        note(relPath, n, 'root-layout-dynamic',
          `\`${api[1]}()\` in a ROOT layout makes EVERY route in this app dynamic — ` +
          'nothing can be cached at all. Read the value from a route param instead ' +
          '(see Frontend/AmariseMaisonAvenue-main/src/app/[country]/layout.tsx).');
      }
    }
  });
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : APPS;
let scanned = 0;

for (const app of targets) {
  const src = join(ROOT, app, 'src');
  if (!existsSync(src)) {
    console.error(`✗ ${app}: no src/ directory`);
    process.exitCode = 1;
    continue;
  }
  for (const file of walk(src)) {
    checkFile(file);
    scanned++;
  }
}

if (violations.length === 0) {
  console.log(`✓ cache hygiene: ${scanned} files clean across ${targets.length} app(s)`);
  process.exit(0);
}

console.error(`\n✗ cache hygiene: ${violations.length} violation(s)\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
  console.error(`    ${v.message}\n`);
}
console.error(
  'If one of these is deliberate, add it to ALLOW in scripts/check-cache-hygiene.mjs\n' +
  'with the reason it is worth the cost.\n',
);
process.exit(1);
