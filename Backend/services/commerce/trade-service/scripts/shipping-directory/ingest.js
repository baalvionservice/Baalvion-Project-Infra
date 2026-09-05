'use strict';
/**
 * World Shipping Directory — full ingest, in dependency order.
 *
 *   node scripts/shipping-directory/ingest.js [--force] [--skip=fetch-vessels,...]
 *
 * Each stage caches to .cache/ and is independently re-runnable, so a failed stage is
 * repaired on its own rather than by restarting the whole pipeline. Stages are ordered
 * because later ones read earlier caches:
 *
 *   reported-fleets → the published capacity ranking (also supplies QIDs to companies)
 *   vessels         → every IMO-numbered vessel      (supplies operator QIDs to companies)
 *   vessel-names    → names for vessels with no English label (reads the vessel cache)
 *   vessel-depth    → capacity, deadweight, yard number and dated events for the hulls
 *                     the directory actually links to
 *   companies       → company profiles for shipping lines + operators + ranked carriers
 *   company-names   → names for companies with no English label (186 of them published
 *                     under a raw QID before this stage existed)
 *   company-depth   → founders, leadership, ownership, financials, HQ coordinates
 *   wikipedia       → quoted lead-section prose for companies, then for ships
 *   image-credits   → photographer and licence for every photograph, from Commons.
 *                     MUST run after company-depth: it credits the portraits that stage
 *                     collects, and load.js drops any image it has no credit for.
 *   infoboxes       → deadweight, owner, operator, beam and a stated TYPE from the
 *                     Wikipedia ship infobox, for the ~3,300 hulls with an article.
 *                     Wikidata does not carry these and Equasis forbids extraction, so
 *                     this is the only lawful source for them. Runs after wikipedia-ships,
 *                     which supplies the article titles.
 *   labels          → English labels for every QID the two caches reference
 *   load            → writes carriers + vessels to Postgres
 *   rollup          → registry counts and the ten-year fleet history
 *   reclassify      → recovers a type for hulls Wikidata types only as "ship", from the
 *                     infobox type field, the article's lead sentence, the ship class or
 *                     the unit of its stated capacity. Must run AFTER load.
 *   context         → cohort ranks and per-dimension statistics, plus the builder/flag
 *                     slugs their hub pages are addressed by. Must run after reclassify,
 *                     or the type cohorts are computed against stale types.
 *
 * A stage that exits non-zero stops the run. That is deliberate: loading on top of a
 * half-fetched cache would publish a directory that looks complete and is not.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const STAGES = [
    { name: 'reported-fleets', script: 'fetch-reported-fleets.js', forceable: true },
    { name: 'vessels', script: 'fetch-vessels.js', forceable: true },
    { name: 'vessel-names', script: 'fetch-vessel-names.js', forceable: true },
    { name: 'vessel-depth', script: 'fetch-vessel-depth.js', forceable: true, args: ['--limit=12000'] },
    { name: 'companies', script: 'fetch-companies.js', forceable: true },
    { name: 'company-names', script: 'fetch-company-names.js', forceable: true },
    { name: 'company-depth', script: 'fetch-company-depth.js', forceable: true },
    { name: 'wikipedia-companies', script: 'fetch-wikipedia.js', forceable: true },
    { name: 'wikipedia-ships', script: 'fetch-wikipedia.js', forceable: true, args: ['--ships', '--limit=15000'] },
    // After company-depth, so the founder/executive portraits it collects get credited too.
    { name: 'image-credits', script: 'fetch-image-credits.js', forceable: true },
    { name: 'infoboxes', script: 'fetch-infoboxes.js', forceable: true },
    { name: 'labels', script: 'fetch-labels.js', forceable: true },
    { name: 'load', script: 'load.js', forceable: false },
    { name: 'rollup', script: 'rollup.js', forceable: false },
    // Order matters below: reclassify rewrites vessel_type, and context aggregates BY
    // vessel_type. Swapping them computes every type cohort against the pre-recovery types.
    { name: 'reclassify', script: 'reclassify.js', forceable: false, args: ['--apply'] },
    { name: 'context', script: 'build-context.js', forceable: false },
];

function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const skip = new Set((args.find((a) => a.startsWith('--skip=')) || '').replace('--skip=', '').split(',').filter(Boolean));

    const started = Date.now();
    for (const stage of STAGES) {
        if (skip.has(stage.name)) { console.log(`\n── ${stage.name}: skipped ──`); continue; }
        console.log(`\n──────── ${stage.name} ────────`);
        const stageArgs = [...(stage.args || []), ...(force && stage.forceable ? ['--force'] : [])];
        const res = spawnSync(process.execPath, [path.join(__dirname, stage.script), ...stageArgs], {
            stdio: 'inherit',
        });
        if (res.status !== 0) {
            console.error(`\n[ingest] FAIL — stage '${stage.name}' exited ${res.status}. Nothing downstream ran.`);
            process.exit(res.status || 1);
        }
    }
    console.log(`\n[ingest] PASS — all stages complete in ${Math.round((Date.now() - started) / 1000)}s`);
}

if (require.main === module) main();
