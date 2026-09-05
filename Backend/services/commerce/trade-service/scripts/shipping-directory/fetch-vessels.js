'use strict';
/**
 * Stage B — pull every IMO-numbered vessel Wikidata knows about into a local cache.
 *
 * Partitioned by IMO prefix rather than LIMIT/OFFSET: deep offsets on WDQS time out, and
 * an offset walk silently shifts under you if the underlying data changes mid-run. A
 * prefix bucket is deterministic and independently retryable, and a bucket that comes
 * back truncated is split into finer prefixes instead of being dropped.
 *
 * Labels are NOT resolved here. `SERVICE wikibase:label` does not bind inside an
 * aggregate, so asking for ?operatorLabel alongside GROUP BY ?ship yields empty strings
 * for every row — a failure with no error. QIDs are collected raw and resolved by
 * fetch-labels.js.
 *
 *   node scripts/shipping-directory/fetch-vessels.js [--only=93,94] [--force]
 */
const fs = require('fs');
const path = require('path');
const { runQuery, qid, str, num, year, sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache', 'vessels');
const MAX_BUCKET_ROWS = 9000; // past this a bucket risks the 32 MiB ceiling; split it.

function vesselQuery(prefix) {
    return `
SELECT ?ship
  (SAMPLE(?imoV)   AS ?imo)
  (SAMPLE(?nameV)  AS ?name)
  (SAMPLE(?mmsiV)  AS ?mmsi)
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?typeV), "/entity/"); separator=",") AS ?types)
  (SAMPLE(?builtV) AS ?built)
  (SAMPLE(?gtV)    AS ?gt)
  (SAMPLE(?ntV)    AS ?nt)
  (SAMPLE(?lenV)   AS ?len)
  (SAMPLE(?beamV)  AS ?beam)
  (SAMPLE(?draftV) AS ?draft)
  (SAMPLE(?speedV) AS ?speed)
  (SAMPLE(?callV)  AS ?callsign)
  (SAMPLE(?imgV)   AS ?img)
  (SAMPLE(?opV)    AS ?operator)
  (SAMPLE(?ownV)   AS ?owner)
  (SAMPLE(?flagV)  AS ?flag)
  (SAMPLE(?portV)  AS ?port)
  (SAMPLE(?bldV)   AS ?builder)
  (SAMPLE(?clsV)   AS ?vclass)
WHERE {
  ?ship wdt:P458 ?imoV .
  FILTER(STRSTARTS(STR(?imoV), "${prefix}"))
  OPTIONAL { ?ship rdfs:label ?nameV . FILTER(LANG(?nameV) = "en") }
  OPTIONAL { ?ship wdt:P587  ?mmsiV }
  OPTIONAL { ?ship wdt:P31   ?typeV }
  OPTIONAL { ?ship wdt:P729  ?builtV }
  OPTIONAL { ?ship wdt:P1093 ?gtV }
  OPTIONAL { ?ship wdt:P2790 ?ntV }
  OPTIONAL { ?ship wdt:P2043 ?lenV }
  OPTIONAL { ?ship wdt:P2261 ?beamV }
  OPTIONAL { ?ship wdt:P2262 ?draftV }
  OPTIONAL { ?ship wdt:P2052 ?speedV }
  OPTIONAL { ?ship wdt:P2317 ?callV }
  OPTIONAL { ?ship wdt:P18   ?imgV }
  OPTIONAL { ?ship wdt:P137  ?opV }
  OPTIONAL { ?ship wdt:P127  ?ownV }
  OPTIONAL { ?ship wdt:P8047 ?flagV }
  OPTIONAL { ?ship wdt:P532  ?portV }
  OPTIONAL { ?ship wdt:P176  ?bldV }
  OPTIONAL { ?ship wdt:P289  ?clsV }
}
GROUP BY ?ship`;
}

/** IMO numbers are 7 digits with a check digit: d1..d6 weighted 7..2, sum's last digit = d7. */
function imoCheckDigitValid(imo) {
    if (!/^\d{7}$/.test(imo)) return false;
    let sum = 0;
    for (let i = 0; i < 6; i += 1) sum += Number(imo[i]) * (7 - i);
    return sum % 10 === Number(imo[6]);
}

function normaliseImo(raw) {
    if (!raw) return null;
    const digits = String(raw).replace(/[^0-9]/g, '');
    return /^\d{7}$/.test(digits) ? digits : null;
}

function mapRow(b) {
    return {
        qid: qid(b, 'ship'),
        imo: normaliseImo(str(b, 'imo')),
        rawImo: str(b, 'imo'),
        name: str(b, 'name'),
        mmsi: str(b, 'mmsi'),
        typeQids: (str(b, 'types') || '').split(',').filter(Boolean),
        builtYear: year(b, 'built'),
        grossTonnage: num(b, 'gt'),
        netTonnage: num(b, 'nt'),
        lengthM: num(b, 'len'),
        beamM: num(b, 'beam'),
        draftM: num(b, 'draft'),
        speedKn: num(b, 'speed'),
        callSign: str(b, 'callsign'),
        imageUrl: str(b, 'img'),
        operatorQid: qid(b, 'operator'),
        ownerQid: qid(b, 'owner'),
        flagQid: qid(b, 'flag'),
        portQid: qid(b, 'port'),
        builderQid: qid(b, 'builder'),
        classQid: qid(b, 'vclass'),
    };
}

async function fetchBucket(prefix, depth = 0) {
    const label = `vessels[${prefix}]`;
    try {
        const rows = await runQuery(vesselQuery(prefix), { label });
        if (rows.length >= MAX_BUCKET_ROWS && depth < 3) {
            console.warn(`  [split] ${label} returned ${rows.length} rows - splitting to be safe`);
            return splitBucket(prefix, depth);
        }
        return rows.map(mapRow);
    } catch (err) {
        if (depth >= 3) throw err;
        console.warn(`  [split] ${label} failed (${err.truncated ? 'truncated' : 'error'}) - splitting`);
        return splitBucket(prefix, depth);
    }
}

async function splitBucket(prefix, depth) {
    const out = [];
    for (const d of '0123456789') {
        out.push(...(await fetchBucket(prefix + d, depth + 1)));
        await sleep(400);
    }
    return out;
}

async function listPrefixes() {
    const rows = await runQuery(
        `SELECT ?prefix (COUNT(DISTINCT ?ship) AS ?n) WHERE {
           ?ship wdt:P458 ?imo .
           BIND(SUBSTR(STR(?imo), 1, 2) AS ?prefix)
         } GROUP BY ?prefix`,
        { label: 'imo-prefixes' },
    );
    return rows
        .map((b) => ({ prefix: str(b, 'prefix'), expected: num(b, 'n') }))
        .filter((p) => /^\d{2}$/.test(p.prefix)) // 'Ca', 'ht', 'IM' are malformed IMO strings
        .sort((a, b) => a.prefix.localeCompare(b.prefix));
}

async function main() {
    const args = process.argv.slice(2);
    const only = (args.find((a) => a.startsWith('--only=')) || '').replace('--only=', '');
    const force = args.includes('--force');
    fs.mkdirSync(CACHE, { recursive: true });

    let prefixes = await listPrefixes();
    if (only) {
        const want = new Set(only.split(','));
        prefixes = prefixes.filter((p) => want.has(p.prefix));
    }
    console.log(`[fetch-vessels] ${prefixes.length} IMO prefix buckets, ${prefixes.reduce((s, p) => s + p.expected, 0)} expected ships`);

    const failed = [];
    let done = 0;
    for (const { prefix, expected } of prefixes) {
        const file = path.join(CACHE, `${prefix}.json`);
        if (!force && fs.existsSync(file)) {
            done += 1;
            continue;
        }
        try {
            const rows = await fetchBucket(prefix);
            fs.writeFileSync(file, JSON.stringify(rows));
            const short = rows.length < expected * 0.9;
            console.log(
                `  [${String(++done).padStart(2)}/${prefixes.length}] ${prefix}: ${rows.length} rows` +
                    (short ? `  WARN expected ~${expected}` : ''),
            );
        } catch (err) {
            failed.push(prefix);
            console.error(`  [FAIL] ${prefix}: ${err.message.slice(0, 160)}`);
        }
        await sleep(600);
    }

    // Guard: never let a partial run look like a complete one.
    const files = fs.readdirSync(CACHE).filter((f) => f.endsWith('.json'));
    const total = files.reduce((s, f) => s + JSON.parse(fs.readFileSync(path.join(CACHE, f))).length, 0);
    console.log(`\n[fetch-vessels] ${failed.length ? 'FAIL' : 'PASS'} - ${total} vessels across ${files.length} buckets`);
    if (failed.length) {
        console.error(`[fetch-vessels] failed buckets: ${failed.join(',')}`);
        console.error(`[fetch-vessels] repair: node scripts/shipping-directory/fetch-vessels.js --only=${failed.join(',')}`);
        process.exitCode = 1;
    }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { imoCheckDigitValid, normaliseImo, CACHE };
