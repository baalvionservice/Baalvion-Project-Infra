'use strict';
/**
 * Stage C — company profiles for the directory.
 *
 * The company set is the union of three populations, because no one of them is the answer:
 *   1. Everything Wikidata types as a shipping line (P31/P279* Q1807108). Catches the
 *      household names, but misses ship managers and one-ship owners.
 *   2. Every entity that actually operates or owns an IMO-numbered vessel we hold.
 *      Catches the operators, but sweeps in navies and coast guards, which are not
 *      commercial shipping companies and are tagged (not silently dropped) as such.
 *   3. Every carrier in the published capacity ranking. Sounds redundant and is not:
 *      Wan Hai Lines, SITC and Sinotrans are all top-30 container lines that Wikidata
 *      types as plain businesses and links to none of our vessels, so populations 1 and 2
 *      both miss them and their published fleet figures were being dropped on the floor.
 *
 * Detail is fetched in VALUES batches. Batches are deliberately small and the aggregate
 * only SAMPLEs scalars: several OPTIONALs over a large VALUES block multiply into a
 * cartesian product that crosses the 32 MiB response ceiling and comes back as
 * mid-string-truncated JSON.
 *
 *   node scripts/shipping-directory/fetch-companies.js [--force]
 */
const fs = require('fs');
const path = require('path');
const { runQuery, qid, str, num, year, sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const VESSEL_CACHE = path.join(CACHE, 'vessels');
const OUT = path.join(CACHE, 'companies.json');
const BATCH = 120;

/**
 * Entities that operate ships but are not commercial shipping companies. They stay in
 * the registry — the US Navy really does operate 605 IMO-numbered vessels — but they are
 * classified so the directory can rank and filter commercial fleets separately instead of
 * putting a navy at the top of a "largest shipping companies" list.
 */
const NON_COMMERCIAL_CLASSES = {
    Q4508: 'navy',
    Q1353040: 'coast_guard',
    Q772547: 'armed_forces',
    Q192350: 'ministry',
    Q327333: 'government_agency',
};

async function shippingLineQids() {
    const rows = await runQuery(
        `SELECT ?c WHERE {
           ?c wdt:P31/wdt:P279* wd:Q1807108 .
           FILTER NOT EXISTS { ?c wdt:P576 ?dissolved }
         }`,
        { label: 'shipping-lines' },
    );
    return rows.map((b) => qid(b, 'c')).filter(Boolean);
}

/** QIDs of carriers in the published ranking — see population 3 above. */
function rankedCarrierQids() {
    const f = path.join(CACHE, 'reported-fleets.json');
    if (!fs.existsSync(f)) return [];
    return JSON.parse(fs.readFileSync(f)).rows.map((r) => r.qid).filter(Boolean);
}

function operatorQidsFromVessels() {
    if (!fs.existsSync(VESSEL_CACHE)) return [];
    const set = new Set();
    for (const f of fs.readdirSync(VESSEL_CACHE).filter((x) => x.endsWith('.json'))) {
        for (const v of JSON.parse(fs.readFileSync(path.join(VESSEL_CACHE, f)))) {
            if (v.operatorQid) set.add(v.operatorQid);
            if (v.ownerQid) set.add(v.ownerQid);
        }
    }
    return [...set];
}

function detailQuery(qids) {
    const values = qids.map((q) => `wd:${q}`).join(' ');
    return `
SELECT ?c
  (SAMPLE(?nameV)     AS ?name)
  (SAMPLE(?officialV) AS ?official)
  (SAMPLE(?descV)     AS ?description)
  (SAMPLE(?siteV)     AS ?website)
  (SAMPLE(?incV)      AS ?inception)
  (SAMPLE(?empV)      AS ?employees)
  (SAMPLE(?logoV)     AS ?logo)
  (SAMPLE(?countryV)  AS ?country)
  (SAMPLE(?hqV)       AS ?hq)
  (SAMPLE(?parentV)   AS ?parent)
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?typeV), "/entity/"); separator=",") AS ?types)
  (SAMPLE(?sitelinksV) AS ?sitelinks)
WHERE {
  VALUES ?c { ${values} }
  OPTIONAL { ?c rdfs:label ?nameV . FILTER(LANG(?nameV) = "en") }
  OPTIONAL { ?c wdt:P1448 ?officialV }
  OPTIONAL { ?c schema:description ?descV . FILTER(LANG(?descV) = "en") }
  OPTIONAL { ?c wdt:P856  ?siteV }
  OPTIONAL { ?c wdt:P571  ?incV }
  OPTIONAL { ?c wdt:P1128 ?empV }
  OPTIONAL { ?c wdt:P154  ?logoV }
  OPTIONAL { ?c wdt:P17   ?countryV }
  OPTIONAL { ?c wdt:P159  ?hqV }
  OPTIONAL { ?c wdt:P749  ?parentV }
  OPTIONAL { ?c wdt:P31   ?typeV }
  OPTIONAL { ?c wikibase:sitelinks ?sitelinksV }
}
GROUP BY ?c`;
}

async function main() {
    const force = process.argv.includes('--force');
    fs.mkdirSync(CACHE, { recursive: true });
    if (fs.existsSync(OUT) && !force) {
        console.log('[fetch-companies] cache present, use --force to refetch');
        return;
    }

    const lines = await shippingLineQids();
    const operators = operatorQidsFromVessels();
    const ranked = rankedCarrierQids();
    const lineSet = new Set(lines);
    const all = [...new Set([...lines, ...operators, ...ranked])];
    console.log(`[fetch-companies] ${lines.length} shipping lines + ${operators.length} vessel operators + ${ranked.length} ranked carriers = ${all.length} distinct entities`);

    const byQid = new Map();
    const failedBatches = [];
    for (let i = 0; i < all.length; i += BATCH) {
        const batch = all.slice(i, i + BATCH);
        const n = Math.floor(i / BATCH) + 1;
        const of = Math.ceil(all.length / BATCH);
        try {
            const rows = await runQuery(detailQuery(batch), { label: `companies[${n}/${of}]` });
            for (const b of rows) {
                const q = qid(b, 'c');
                if (!q) continue;
                byQid.set(q, {
                    qid: q,
                    name: str(b, 'name'),
                    officialName: str(b, 'official'),
                    description: str(b, 'description'),
                    website: str(b, 'website'),
                    foundedYear: year(b, 'inception'),
                    employees: num(b, 'employees'),
                    logoUrl: str(b, 'logo'),
                    countryQid: qid(b, 'country'),
                    hqQid: qid(b, 'hq'),
                    parentQid: qid(b, 'parent'),
                    typeQids: (str(b, 'types') || '').split(',').filter(Boolean),
                    sitelinks: num(b, 'sitelinks') || 0,
                    isShippingLine: lineSet.has(q),
                });
            }
            process.stdout.write(`\r  batch ${n}/${of} — ${byQid.size} resolved`);
        } catch (err) {
            failedBatches.push(n);
            console.error(`\n  [FAIL] batch ${n}: ${err.message.slice(0, 140)}`);
        }
        await sleep(400);
    }

    // Guard: count what did NOT come back rather than assuming the loop worked.
    const unresolved = all.filter((q) => !byQid.has(q));
    const out = [...byQid.values()];
    fs.writeFileSync(OUT, JSON.stringify(out, null, 0));
    console.log(`\n[fetch-companies] ${failedBatches.length ? 'FAIL' : 'PASS'} — ${out.length} companies written`);
    console.log(`  shipping lines: ${out.filter((c) => c.isShippingLine).length}`);
    console.log(`  unresolved:     ${unresolved.length}${unresolved.length ? ` (e.g. ${unresolved.slice(0, 5).join(',')})` : ''}`);
    if (failedBatches.length) process.exitCode = 1;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { NON_COMMERCIAL_CLASSES, OUT, CACHE };
