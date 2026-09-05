'use strict';
/**
 * Stage C2 — the depth layer for company pages: who founded the company, who runs it,
 * what it owns, what it earns, and where its head office actually is.
 *
 * Split from fetch-companies.js rather than bolted onto it, for a reason the 32 MiB
 * ceiling taught us in stage B: this needs eight more OPTIONAL blocks and four
 * GROUP_CONCATs, and adding those to the existing aggregate multiplies the same query
 * into a cartesian product that comes back truncated. Four narrow queries that each do
 * one job are slower and survive; one wide query is faster and silently loses rows.
 *
 * The four passes:
 *   A  structure   — industry, legal form, listing IDs, HQ coordinates, dissolution
 *   B  people/orgs — founder / CEO / board / subsidiary / owner / product QIDs
 *   C  financials  — revenue, profit, assets WITH their point-in-time and currency
 *   D  entities    — resolve every QID collected in B to a name, image and description
 *
 * A financial figure without its year is worse than no figure: "revenue $55bn" reads as
 * current and may be a decade old. Pass C therefore reads the full statement node
 * (p:/psv:) rather than the truth-ranked wdt: shortcut, keeps the point-in-time
 * qualifier, and DROPS any value whose year cannot be determined.
 *
 *   node scripts/shipping-directory/fetch-company-depth.js [--force] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const { runQuery, qid, str, num, year, sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const COMPANIES = path.join(CACHE, 'companies.json');
const OUT = path.join(CACHE, 'company-depth.json');

// Narrower than fetch-companies' 120: these queries carry many more OPTIONALs each.
const BATCH_STRUCTURE = 60;
const BATCH_LINKS = 50;
const BATCH_FINANCIALS = 40;
const BATCH_ENTITIES = 150;

/**
 * Currency unit QIDs -> ISO 4217. Wikidata gives the unit as an entity, and a page that
 * prints "55,000,000,000" with no currency is not a fact. Anything not in this map is
 * kept as its QID and resolved to a label in pass D, so an unusual currency degrades to
 * a spelled-out name rather than disappearing.
 */
const CURRENCY_QIDS = {
    Q4917: 'USD', Q4916: 'EUR', Q25224: 'DKK', Q25417: 'SEK', Q25381: 'NOK',
    Q25224812: 'DKK', Q8146: 'GBP', Q25344: 'CHF', Q8134: 'JPY', Q39099: 'JPY',
    Q41509: 'CNY', Q17101985: 'CNY', Q41182: 'KRW', Q47190: 'SGD', Q42332: 'HKD',
    Q4726: 'INR', Q193297: 'TWD', Q172524: 'AED', Q4508: null,
};

// ── pass A — corporate structure ─────────────────────────────────────────────

function structureQuery(qids) {
    return `
SELECT ?c
  (SAMPLE(?indV)     AS ?industry)
  (SAMPLE(?formV)    AS ?legalForm)
  (SAMPLE(?formedV)  AS ?formedIn)
  (SAMPLE(?exchV)    AS ?exchange)
  (SAMPLE(?isinV)    AS ?isin)
  (SAMPLE(?leiV)     AS ?lei)
  (SAMPLE(?dissV)    AS ?dissolved)
  (SAMPLE(?coordV)   AS ?coord)
  (SAMPLE(?imgV)     AS ?image)
  (SAMPLE(?nativeV)  AS ?nativeName)
  (SAMPLE(?twV)      AS ?twitter)
  (SAMPLE(?liV)      AS ?linkedin)
  (SAMPLE(?fbV)      AS ?facebook)
WHERE {
  VALUES ?c { ${qids.map((q) => `wd:${q}`).join(' ')} }
  OPTIONAL { ?c wdt:P452  ?indV }
  OPTIONAL { ?c wdt:P1454 ?formV }
  OPTIONAL { ?c wdt:P740  ?formedV }
  OPTIONAL { ?c wdt:P414  ?exchV }
  OPTIONAL { ?c wdt:P946  ?isinV }
  OPTIONAL { ?c wdt:P1278 ?leiV }
  OPTIONAL { ?c wdt:P576  ?dissV }
  OPTIONAL { ?c wdt:P159/wdt:P625 ?coordV }
  OPTIONAL { ?c wdt:P18   ?imgV }
  OPTIONAL { ?c wdt:P1705 ?nativeV }
  OPTIONAL { ?c wdt:P2002 ?twV }
  OPTIONAL { ?c wdt:P4264 ?liV }
  OPTIONAL { ?c wdt:P2013 ?fbV }
}
GROUP BY ?c`;
}

/** "Point(4.7 52.3)" -> { lat, lon }. Order is lon-first in WKT; getting it backwards
 *  drops head offices into the sea, so it is parsed explicitly rather than destructured. */
function parsePoint(wkt) {
    if (!wkt) return { lat: null, lon: null };
    const m = /^Point\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)$/.exec(wkt);
    if (!m) return { lat: null, lon: null };
    const lon = Number(m[1]);
    const lat = Number(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { lat: null, lon: null };
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return { lat: null, lon: null };
    return { lat, lon };
}

// ── pass B — people and related organisations ────────────────────────────────

function linksQuery(qids) {
    return `
SELECT ?c
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?founderV), "/entity/"); separator=",") AS ?founders)
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?ceoV),     "/entity/"); separator=",") AS ?ceos)
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?boardV),   "/entity/"); separator=",") AS ?board)
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?subV),     "/entity/"); separator=",") AS ?subsidiaries)
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?ownerV),   "/entity/"); separator=",") AS ?owners)
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?prodV),    "/entity/"); separator=",") AS ?products)
WHERE {
  VALUES ?c { ${qids.map((q) => `wd:${q}`).join(' ')} }
  OPTIONAL { ?c wdt:P112  ?founderV }
  OPTIONAL { ?c wdt:P169  ?ceoV }
  OPTIONAL { ?c wdt:P3320 ?boardV }
  OPTIONAL { ?c wdt:P355  ?subV }
  OPTIONAL { ?c wdt:P127  ?ownerV }
  OPTIONAL { ?c wdt:P1056 ?prodV }
}
GROUP BY ?c`;
}

// ── pass C — financials, each with its own year and currency ─────────────────

const MONEY_PROPS = [
    ['P2139', 'revenue'],
    ['P2295', 'netProfit'],
    ['P3362', 'operatingIncome'],
    ['P2403', 'totalAssets'],
    ['P2137', 'totalEquity'],
    ['P2226', 'marketCap'],
];

function financialsQuery(qids, prop) {
    return `
SELECT ?c ?amount ?unit ?when WHERE {
  VALUES ?c { ${qids.map((q) => `wd:${q}`).join(' ')} }
  ?c p:${prop} ?st .
  ?st psv:${prop} ?node .
  ?node wikibase:quantityAmount ?amount .
  OPTIONAL { ?node wikibase:quantityUnit ?unit }
  OPTIONAL { ?st pq:P585 ?when }
}`;
}

// ── pass D — resolve collected QIDs to displayable entities ──────────────────

function entityQuery(qids) {
    return `
SELECT ?e
  (SAMPLE(?labelV) AS ?label)
  (SAMPLE(?descV)  AS ?description)
  (SAMPLE(?imgV)   AS ?image)
  (SAMPLE(?bornV)  AS ?born)
  (SAMPLE(?diedV)  AS ?died)
  (SAMPLE(?humanV) AS ?isHuman)
WHERE {
  VALUES ?e { ${qids.map((q) => `wd:${q}`).join(' ')} }
  OPTIONAL { ?e rdfs:label ?labelV . FILTER(LANG(?labelV) = "en") }
  OPTIONAL { ?e schema:description ?descV . FILTER(LANG(?descV) = "en") }
  OPTIONAL { ?e wdt:P18 ?imgV }
  OPTIONAL { ?e wdt:P569 ?bornV }
  OPTIONAL { ?e wdt:P570 ?diedV }
  OPTIONAL { ?e wdt:P31 ?humanV . FILTER(?humanV = wd:Q5) }
}
GROUP BY ?e`;
}

// ─────────────────────────────────────────────────────────────────────────────

async function runBatched(all, size, build, onRows, label) {
    const failed = [];
    for (let i = 0; i < all.length; i += size) {
        const batch = all.slice(i, i + size);
        const n = Math.floor(i / size) + 1;
        const of = Math.ceil(all.length / size);
        try {
            onRows(await runQuery(build(batch), { label: `${label}[${n}/${of}]` }), batch);
            process.stdout.write(`\r  ${label} ${n}/${of}`);
        } catch (err) {
            failed.push(n);
            console.error(`\n  [FAIL] ${label} batch ${n}: ${err.message.slice(0, 140)}`);
        }
        await sleep(350);
    }
    process.stdout.write('\n');
    return failed;
}

const splitQids = (v) => (v || '').split(',').filter((x) => /^Q\d+$/.test(x));

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const limitArg = Number((args.find((a) => a.startsWith('--limit=')) || '').replace('--limit=', '')) || 0;

    if (!fs.existsSync(COMPANIES)) {
        console.error('[company-depth] companies.json missing — run fetch-companies.js first');
        process.exit(1);
    }
    if (fs.existsSync(OUT) && !force) {
        console.log('[company-depth] cache present, use --force to refetch');
        return;
    }

    const companies = JSON.parse(fs.readFileSync(COMPANIES));
    // Depth is most valuable where a reader will actually land. Ordering by sitelink count
    // means the household names are fetched first, so a run interrupted halfway still
    // leaves the pages people reach in the best state rather than a random 60%.
    const ordered = [...companies].sort((a, b) => (b.sitelinks || 0) - (a.sitelinks || 0));
    const targets = (limitArg ? ordered.slice(0, limitArg) : ordered).map((c) => c.qid);
    console.log(`[company-depth] ${targets.length} companies`);

    const depth = new Map(targets.map((q) => [q, { qid: q }]));
    const allFailed = [];

    // A — structure
    allFailed.push(...await runBatched(targets, BATCH_STRUCTURE, structureQuery, (rows) => {
        for (const b of rows) {
            const q = qid(b, 'c');
            const d = depth.get(q);
            if (!d) continue;
            const { lat, lon } = parsePoint(str(b, 'coord'));
            Object.assign(d, {
                industryQid: qid(b, 'industry'),
                legalFormQid: qid(b, 'legalForm'),
                formedInQid: qid(b, 'formedIn'),
                exchangeQid: qid(b, 'exchange'),
                isin: str(b, 'isin'),
                lei: str(b, 'lei'),
                dissolvedYear: year(b, 'dissolved'),
                hqLat: lat,
                hqLon: lon,
                imageUrl: str(b, 'image'),
                nativeName: str(b, 'nativeName'),
                social: {
                    twitter: str(b, 'twitter'),
                    linkedin: str(b, 'linkedin'),
                    facebook: str(b, 'facebook'),
                },
            });
        }
    }, 'structure'));

    // B — people and orgs
    allFailed.push(...await runBatched(targets, BATCH_LINKS, linksQuery, (rows) => {
        for (const b of rows) {
            const q = qid(b, 'c');
            const d = depth.get(q);
            if (!d) continue;
            d.founderQids = splitQids(str(b, 'founders'));
            d.ceoQids = splitQids(str(b, 'ceos'));
            d.boardQids = splitQids(str(b, 'board')).slice(0, 12);
            d.subsidiaryQids = splitQids(str(b, 'subsidiaries')).slice(0, 24);
            d.ownerQids = splitQids(str(b, 'owners')).slice(0, 8);
            d.productQids = splitQids(str(b, 'products')).slice(0, 12);
        }
    }, 'links'));

    // C — financials, one property at a time so a failure loses one metric, not all six
    for (const [prop, key] of MONEY_PROPS) {
        allFailed.push(...await runBatched(targets, BATCH_FINANCIALS, (batch) => financialsQuery(batch, prop), (rows) => {
            for (const b of rows) {
                const q = qid(b, 'c');
                const d = depth.get(q);
                if (!d) continue;
                const amount = num(b, 'amount');
                const when = year(b, 'when');
                // No year, no figure. A stale number presented as current is the failure
                // mode this whole file exists to avoid.
                if (amount === null || when === null) continue;
                const unitQid = qid(b, 'unit');
                const prev = d.financials && d.financials[key];
                if (prev && prev.year >= when) continue;
                d.financials = d.financials || {};
                d.financials[key] = { amount, year: when, unitQid };
            }
        }, `money:${key}`));
    }

    // D — resolve every QID pass A/B collected
    const entityQids = new Set();
    for (const d of depth.values()) {
        for (const k of ['founderQids', 'ceoQids', 'boardQids', 'subsidiaryQids', 'ownerQids', 'productQids']) {
            for (const q of d[k] || []) entityQids.add(q);
        }
        for (const k of ['industryQid', 'legalFormQid', 'formedInQid', 'exchangeQid']) {
            if (d[k]) entityQids.add(d[k]);
        }
        for (const f of Object.values(d.financials || {})) {
            if (f.unitQid && !(f.unitQid in CURRENCY_QIDS)) entityQids.add(f.unitQid);
        }
    }
    const entityList = [...entityQids];
    console.log(`[company-depth] resolving ${entityList.length} referenced entities`);

    const entities = {};
    allFailed.push(...await runBatched(entityList, BATCH_ENTITIES, entityQuery, (rows) => {
        for (const b of rows) {
            const q = qid(b, 'e');
            if (!q) continue;
            entities[q] = {
                qid: q,
                name: str(b, 'label'),
                description: str(b, 'description'),
                imageUrl: str(b, 'image'),
                bornYear: year(b, 'born'),
                diedYear: year(b, 'died'),
                isHuman: Boolean(qid(b, 'isHuman')),
            };
        }
    }, 'entities'));

    const out = {
        fetchedAt: new Date().toISOString(),
        currencyQids: CURRENCY_QIDS,
        companies: [...depth.values()],
        entities,
    };
    fs.writeFileSync(OUT, JSON.stringify(out));

    // Reconcile rather than trust the loop — the stage-B lesson.
    const withFounders = out.companies.filter((c) => (c.founderQids || []).length).length;
    const withCeo = out.companies.filter((c) => (c.ceoQids || []).length).length;
    const withMoney = out.companies.filter((c) => c.financials).length;
    const withCoords = out.companies.filter((c) => c.hqLat !== null && c.hqLat !== undefined).length;
    const unresolved = entityList.filter((q) => !entities[q]);

    console.log(`\n[company-depth] ${allFailed.length ? 'FAIL' : 'PASS'} — ${out.companies.length} companies written`);
    console.log(`  with a founder on record: ${withFounders}`);
    console.log(`  with a chief executive:   ${withCeo}`);
    console.log(`  with dated financials:    ${withMoney}`);
    console.log(`  with HQ coordinates:      ${withCoords}`);
    console.log(`  entities resolved:        ${entityList.length - unresolved.length}/${entityList.length}`);
    if (allFailed.length) process.exitCode = 1;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { OUT, CURRENCY_QIDS, parsePoint };
