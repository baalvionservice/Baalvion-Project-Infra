'use strict';
/*
 * Standalone gate for a single depth-rewrite article, so a writer can verify its own work
 * before returning it rather than having the failure surface later in a batch.
 *
 *   node scripts/check-article.cjs <path-to-article.json>
 *
 * The JSON must carry: slug, title, seoTitle, seoDescription, researchNote, citations[],
 * keyTakeaways[], faq[], body. Exits 0 when the article meets the house standard and is
 * structurally distinct from every article already written; exits 1 with reasons otherwise.
 *
 * Reconstructed 2026-09-04 after the original was wiped by an untracked-files clean on the
 * shared main checkout — see house-style.cjs's header note and project memory.
 */
const fs = require('node:fs');
const path = require('node:path');
const { shortfalls, corpusIssues, measure, FLOORS } = require('./house-style.cjs');

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/check-article.cjs <article.json>');
  process.exit(2);
}

let entry;
try {
  entry = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`✗ cannot parse ${file}: ${e.message}`);
  process.exit(1);
}

const REQUIRED = ['slug', 'title', 'seoTitle', 'seoDescription', 'researchNote', 'citations', 'keyTakeaways', 'faq', 'body'];
const missing = REQUIRED.filter((k) => entry[k] === undefined || entry[k] === null || entry[k] === '');
if (missing.length) {
  console.error(`✗ missing required field(s): ${missing.join(', ')}`);
  process.exit(1);
}

// Every citation must be a real URL with a title; a bare domain is not a source.
const badCitations = (entry.citations || []).filter(
  (c) => !c || typeof c.url !== 'string' || !/^https?:\/\/.+\/.+/.test(c.url) || !c.title,
);
if (badCitations.length) {
  console.error(`✗ ${badCitations.length} citation(s) missing a real url/title`);
  process.exit(1);
}

const issues = shortfalls(entry);

// A citation that's never actually linked from the body is decorative, not sourced.
const unlinked = (entry.citations || []).filter((c) => !entry.body.includes(`href="${c.url}"`));
if (unlinked.length) {
  issues.push(`citation(s) never linked from the body: ${unlinked.map((c) => c.url).join(', ')}`);
}

const m = measure(entry);
console.log(entry.slug);
console.log(
  `  ${m.words}w · ${m.sections} h2 · ${m.subsections} h3 · ${m.tables} tables · ${m.callouts} callouts · ` +
  `${m.citations} cites · ${m.faq} faq · ${m.keyTakeaways} takeaways · em-dash/1k ${m.emDashesPerThousand.toFixed(1)}`,
);
console.log(
  `  floors: ${Object.entries(FLOORS).map(([k, v]) => `${k}≥${v}`).join(' ')}`,
);
console.log('');

if (issues.length) {
  console.error('✗ NOT ACCEPTABLE — fix every line below, then re-run this check:');
  for (const i of issues) console.error(`   · ${i}`);
  process.exit(1);
}

console.log('✓ meets the house standard');

// Optional corpus-level check against sibling articles already staged in the same directory.
const dir = path.dirname(file);
try {
  const siblings = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json') && path.join(dir, f) !== path.resolve(file))
    .map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; }
    })
    .filter(Boolean);
  if (siblings.length) {
    const corpus = corpusIssues([entry, ...siblings]);
    if (corpus.length) {
      console.log('\n(corpus-level, not a hard failure — check the batch as a whole):');
      for (const c of corpus) console.log(`   · ${c}`);
    }
  }
} catch { /* best-effort */ }
