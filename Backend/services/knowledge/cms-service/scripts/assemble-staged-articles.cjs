'use strict';
/*
 * Folds staged article JSON (written by the depth-rewrite workflow agents) into a
 * committed data file the publish script can load.
 *
 *   node scripts/assemble-staged-articles.cjs <stagingDir> <outFile.data.cjs>
 *
 * Refuses to write anything unless EVERY staged article passes the house standard, and
 * re-runs the corpus-level formula check across the combined set — an article can pass on
 * its own and still duplicate a sibling's structure, which is only visible in aggregate.
 */
const fs = require('node:fs');
const path = require('node:path');
const { shortfalls, corpusIssues, measure } = require('./house-style.cjs');

const [stagingDir, outFile] = process.argv.slice(2);
if (!stagingDir || !outFile) {
  console.error('usage: node scripts/assemble-staged-articles.cjs <stagingDir> <outFile.data.cjs>');
  process.exit(2);
}

const staged = fs
  .readdirSync(stagingDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(stagingDir, f), 'utf8'));
    } catch (e) {
      console.error(`✗ ${f}: unparseable — ${e.message}`);
      return null;
    }
  })
  .filter(Boolean)
  .sort((a, b) => a.slug.localeCompare(b.slug));

if (!staged.length) {
  console.error(`no staged articles in ${stagingDir}`);
  process.exit(1);
}

// Everything already committed, so the new batch is checked against the existing corpus too.
const existing = [];
for (const f of fs.readdirSync(__dirname)) {
  if (/^imperialpedia-depth-.*\.data\.cjs$/.test(f) && path.resolve(__dirname, f) !== path.resolve(outFile)) {
    existing.push(...require(path.join(__dirname, f)));
  }
}

let blocked = false;
for (const a of staged) {
  const problems = shortfalls(a);
  const m = measure(a);
  console.log(`${problems.length ? '✗' : '✓'} ${a.slug.padEnd(38)} ${String(m.words).padStart(5)}w ${m.sections}h2 ${m.subsections}h3 ${m.citations}src`);
  if (problems.length) {
    blocked = true;
    problems.forEach((p) => console.log(`     · ${p}`));
  }
}

const cross = corpusIssues([...existing, ...staged]);
if (cross.length) {
  blocked = true;
  console.log('\n✗ corpus-level problems across the combined set:');
  cross.forEach((c) => console.log(`   · ${c}`));
}

if (blocked) {
  console.log('\nNothing written. Fix the above and re-run.');
  process.exit(1);
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const q = (s) => JSON.stringify(String(s));

const body = staged
  .map(
    (a) => `  {
    slug: ${q(a.slug)},
    title: ${q(a.title)},
    seoTitle: ${q(a.seoTitle)},
    seoDescription: ${q(a.seoDescription)},
    researchNote:
      ${q(a.researchNote)},
    citations: ${JSON.stringify(a.citations)},
    keyTakeaways: ${JSON.stringify(a.keyTakeaways, null, 6).replace(/\n/g, '\n    ')},
    faq: ${JSON.stringify(a.faq, null, 6).replace(/\n/g, '\n    ')},
    body: \`${esc(a.body)}\`,
  },`,
  )
  .join('\n');

const header = `'use strict';
/*
 * Depth rewrites produced by the imperialpedia-depth-batch workflow: one research agent per
 * article gathering primary-source facts with verbatim quotes, one writer restricted to those
 * facts, and an independent fact-checker that re-fetched every cited URL and recomputed every
 * derived figure. Each entry passed scripts/check-article.cjs, and the set passed the
 * corpus-level formula check in scripts/house-style.cjs.
 *
 * Each entry's researchNote records which figures came from which source.
 *
 * Consumed by publish-imperialpedia-depth-rewrites.cjs.
 */

module.exports = [
${body}
];
`;

fs.writeFileSync(outFile, header);
console.log(`\n✓ wrote ${staged.length} article(s) → ${outFile}`);
