'use strict';
/**
 * Stage B3 — the particulars a ship page is actually asked for.
 *
 * Stage B fetches what every hull has: tonnage, dimensions, flag, builder. This fetches
 * what makes a specific ship interesting — how much it can carry, what yard number it
 * was built under, when it was launched as distinct from delivered, and what has
 * happened to it since. Those live on properties stage B does not touch:
 *
 *   P1083 maximum capacity   — TEU for a container ship, berths for a cruise ship
 *   P4519 payload mass       — deadweight tonnage
 *   P2067 mass               — displacement
 *   P617  yard number        — the builder's own hull number
 *   P793  significant event  — delivery, grounding, sale, scrapping, with dates
 *   P3349 designed to carry
 *
 * Targeted rather than universal. Re-running stage B over all 96k hulls to add six
 * properties would be hours of WDQS time to enrich pages nobody reaches; this covers the
 * ships that are attributed to a fleet, photographed, or large enough to matter, which
 * is the set the directory actually links to.
 *
 * P1083 IS NOT A TEU COLUMN. It is "maximum capacity" in whatever unit the item states —
 * containers for a boxship, passengers for a ferry, cubic metres for an LNG carrier. The
 * unit is carried through and load.js only writes capacity_teu when the unit really is
 * TEU; writing a ferry's passenger count into a TEU column would be a fabricated figure
 * on a page that shows it as cargo capacity.
 *
 *   node scripts/shipping-directory/fetch-vessel-depth.js [--force] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const { runQuery, qid, str, num, year, sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const VESSEL_CACHE = path.join(CACHE, 'vessels');
const OUT = path.join(CACHE, 'vessel-depth.json');
const BATCH = 90;

/**
 * Unit QIDs, each one verified against a real vessel item rather than guessed.
 *
 * This matters more than it looks. P1083 "maximum capacity" is whatever the ship carries,
 * and across 12,000 hulls it resolves to: passengers (347), TEU (15), lane metres (3),
 * cubic metres (1), motor cars (1) — and a dimensionless "1" (483) that states no unit at
 * all. Writing P1083 into a TEU column would therefore have published several hundred
 * ferry PASSENGER counts on the site as container capacity.
 *
 * So each unit maps to its own field, and a capacity whose unit is the dimensionless "1"
 * is kept as a raw value with no unit rather than being guessed from the vessel type.
 * "It's a container ship so 20,124 must be TEU" is an inference, not a source.
 */
const TEU_UNITS = new Set(['Q488021']);                       // twenty-foot equivalent unit
const PASSENGER_UNITS = new Set(['Q319604', 'Q215627', 'Q5']); // passenger / person / human
const LANE_METRE_UNITS = new Set(['Q1164756']);
const CUBIC_METRE_UNITS = new Set(['Q25517']);
/** Dimensionless. States a number and refuses to say of what. */
const UNITLESS = new Set(['1', 'Q199']);

/**
 * Mass units, for deadweight (P4519) and displacement (P2067). Tonnes in practice;
 * kilograms are converted rather than dropped. Anything else is left null — an
 * unrecognised mass unit silently treated as tonnes is how a 200,000 kg coaster becomes
 * a 200,000 DWT capesize.
 */
const TONNE_UNITS = new Set(['Q191118']);
const KILOGRAM_UNITS = new Set(['Q11570']);

function toTonnes(value, unitQid) {
    if (value === null || value === undefined) return null;
    if (TONNE_UNITS.has(unitQid)) return value;
    if (KILOGRAM_UNITS.has(unitQid)) return value / 1000;
    return null;
}

function depthQuery(qids) {
    return `
SELECT ?ship
  (SAMPLE(?capV)     AS ?capacity)
  (SAMPLE(?capUnitV) AS ?capacityUnit)
  (SAMPLE(?dwtV)     AS ?dwt)
  (SAMPLE(?dwtUnitV) AS ?dwtUnit)
  (SAMPLE(?massV)    AS ?mass)
  (SAMPLE(?massUnitV) AS ?massUnit)
  (SAMPLE(?yardV)    AS ?yardNumber)
  (SAMPLE(?launchV)  AS ?launched)
  (SAMPLE(?carriesV) AS ?carries)
  (SAMPLE(?statusV)  AS ?status)
WHERE {
  VALUES ?ship { ${qids.map((q) => `wd:${q}`).join(' ')} }
  OPTIONAL {
    ?ship p:P1083/psv:P1083 ?capNode .
    ?capNode wikibase:quantityAmount ?capV .
    OPTIONAL { ?capNode wikibase:quantityUnit ?capUnitV }
  }
  OPTIONAL {
    ?ship p:P4519/psv:P4519 ?dwtNode .
    ?dwtNode wikibase:quantityAmount ?dwtV .
    OPTIONAL { ?dwtNode wikibase:quantityUnit ?dwtUnitV }
  }
  OPTIONAL {
    ?ship p:P2067/psv:P2067 ?massNode .
    ?massNode wikibase:quantityAmount ?massV .
    OPTIONAL { ?massNode wikibase:quantityUnit ?massUnitV }
  }
  OPTIONAL { ?ship wdt:P617  ?yardV }
  OPTIONAL { ?ship wdt:P793  ?statusV }
  OPTIONAL { ?ship wdt:P3349 ?carriesV }
  OPTIONAL { ?ship wdt:P1249 ?launchV }
}
GROUP BY ?ship`;
}

/**
 * Significant events with their dates, as its own query.
 *
 * Folded into the aggregate above it would multiply every other OPTIONAL by the number
 * of events — the cartesian blow-up that truncates a WDQS response into unparseable
 * JSON. Kept separate, it is one small ungrouped query.
 */
function eventsQuery(qids) {
    return `
SELECT ?ship ?event ?when WHERE {
  VALUES ?ship { ${qids.map((q) => `wd:${q}`).join(' ')} }
  ?ship p:P793 ?st .
  ?st ps:P793 ?event .
  OPTIONAL { ?st pq:P585 ?when }
}`;
}

function candidateVessels(limit) {
    if (!fs.existsSync(VESSEL_CACHE)) return [];
    const all = [];
    for (const f of fs.readdirSync(VESSEL_CACHE).filter((x) => x.endsWith('.json'))) {
        for (const v of JSON.parse(fs.readFileSync(path.join(VESSEL_CACHE, f)))) {
            if (!v.qid || !v.imo) continue;
            const worth = Boolean(v.operatorQid) || Boolean(v.imageUrl) || (v.grossTonnage || 0) >= 25000;
            if (worth) all.push({ qid: v.qid, gt: v.grossTonnage || 0, linked: Boolean(v.operatorQid) });
        }
    }
    all.sort((a, b) => (b.linked - a.linked) || (b.gt - a.gt));
    const seen = new Set();
    const out = [];
    for (const v of all) {
        if (seen.has(v.qid)) continue;
        seen.add(v.qid);
        out.push(v.qid);
        if (limit && out.length >= limit) break;
    }
    return out;
}

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const limit = Number((args.find((a) => a.startsWith('--limit=')) || '').replace('--limit=', '')) || 0;

    const existing = !force && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : {};
    const candidates = candidateVessels(limit).filter((q) => !(q in existing));
    console.log(`[vessel-depth] ${candidates.length} vessels to enrich`);

    const failed = [];
    // The event-label pass below still runs when there is nothing new to fetch: it repairs
    // a cache written before that pass existed, whose events are bare QIDs that load.js
    // silently drops. A stage that can only fix itself on a full refetch is not a repair.
    for (let i = 0; i < candidates.length; i += BATCH) {
        const batch = candidates.slice(i, i + BATCH);
        const n = Math.floor(i / BATCH) + 1;
        const of = Math.ceil(candidates.length / BATCH);
        try {
            const rows = await runQuery(depthQuery(batch), { label: `vessel-depth[${n}/${of}]` });
            for (const b of rows) {
                const q = qid(b, 'ship');
                if (!q) continue;
                const capUnit = qid(b, 'capacityUnit');
                const dwtUnit = qid(b, 'dwtUnit');
                const massUnit = qid(b, 'massUnit');
                const capacity = num(b, 'capacity');
                const capUnitKnown = capUnit && !UNITLESS.has(capUnit);
                existing[q] = {
                    // The raw capacity travels with its unit QID and is only rendered
                    // where that unit is known; see UNITLESS above.
                    capacity: capUnitKnown ? capacity : null,
                    capacityUnitQid: capUnitKnown ? capUnit : null,
                    teu: capUnit && TEU_UNITS.has(capUnit) ? capacity : null,
                    passengers: capUnit && PASSENGER_UNITS.has(capUnit) ? capacity : null,
                    laneMetres: capUnit && LANE_METRE_UNITS.has(capUnit) ? capacity : null,
                    cubicMetres: capUnit && CUBIC_METRE_UNITS.has(capUnit) ? capacity : null,
                    dwt: toTonnes(num(b, 'dwt'), dwtUnit),
                    displacement: toTonnes(num(b, 'mass'), massUnit),
                    yardNumber: str(b, 'yardNumber'),
                    launchedYear: year(b, 'launched'),
                    carriesQid: qid(b, 'carries'),
                    events: [],
                };
            }
            // Fill in the batch's misses so a re-run does not re-ask for them.
            for (const q of batch) if (!(q in existing)) existing[q] = null;
        } catch (err) {
            failed.push(n);
            console.error(`\n  [FAIL] particulars batch ${n}: ${err.message.slice(0, 140)}`);
        }
        process.stdout.write(`\r  particulars ${n}/${of}`);
        await sleep(400);
    }
    process.stdout.write('\n');

    // Events, only for the ships that actually have depth rows.
    const withRows = candidates.filter((q) => existing[q]);
    for (let i = 0; i < withRows.length; i += BATCH) {
        const batch = withRows.slice(i, i + BATCH);
        const n = Math.floor(i / BATCH) + 1;
        const of = Math.ceil(withRows.length / BATCH);
        try {
            const rows = await runQuery(eventsQuery(batch), { label: `vessel-events[${n}/${of}]` });
            for (const b of rows) {
                const q = qid(b, 'ship');
                if (!q || !existing[q]) continue;
                const ev = qid(b, 'event');
                if (!ev) continue;
                existing[q].events.push({ qid: ev, year: year(b, 'when') });
            }
        } catch (err) {
            failed.push(`events:${n}`);
            console.error(`\n  [FAIL] events batch ${n}: ${err.message.slice(0, 140)}`);
        }
        process.stdout.write(`\r  events ${n}/${of}`);
        await sleep(400);
    }
    process.stdout.write('\n');

    /**
     * Resolve the event QIDs to names.
     *
     * Without this the events are bare QIDs, load.js drops every row it cannot name, and
     * 2,420 ships with a recorded history publish 32 timeline entries between them — a
     * silent 99% loss with no error anywhere. The set is small (a few hundred distinct
     * event types across the whole fleet) because ships share events: "shipwrecking",
     * "sea trial", "keel laying".
     */
    const eventQids = new Set();
    for (const r of Object.values(existing)) {
        if (!r) continue;
        for (const e of r.events || []) if (e.qid) eventQids.add(e.qid);
    }
    const eventList = [...eventQids];
    const eventLabels = {};
    console.log(`[vessel-depth] resolving ${eventList.length} distinct event types`);
    for (let i = 0; i < eventList.length; i += 200) {
        const batch = eventList.slice(i, i + 200);
        try {
            const rows = await runQuery(
                `SELECT ?e (SAMPLE(?l) AS ?label) WHERE {
                   VALUES ?e { ${batch.map((q) => `wd:${q}`).join(' ')} }
                   OPTIONAL { ?e rdfs:label ?l . FILTER(LANG(?l) = "en") }
                 } GROUP BY ?e`,
                { label: `event-labels[${i / 200 + 1}]` },
            );
            for (const b of rows) {
                const q = qid(b, 'e');
                const l = str(b, 'label');
                if (q && l) eventLabels[q] = l;
            }
        } catch (err) {
            failed.push(`event-labels:${i}`);
            console.error(`\n  [FAIL] event labels @${i}: ${err.message.slice(0, 120)}`);
        }
        await sleep(350);
    }
    for (const r of Object.values(existing)) {
        if (!r) continue;
        for (const e of r.events || []) e.event = eventLabels[e.qid] || null;
    }

    fs.writeFileSync(OUT, JSON.stringify(existing));

    const rows = Object.values(existing).filter(Boolean);
    console.log(`  event types named:         ${Object.keys(eventLabels).length}/${eventList.length}`);
    console.log(`[vessel-depth] ${failed.length ? 'PARTIAL' : 'PASS'} — ${rows.length} hulls in cache`
        + (candidates.length ? ` (${candidates.length} fetched this run)` : ' (repair run, nothing new fetched)'));
    console.log(`  with a TEU capacity:       ${rows.filter((r) => r.teu).length}`);
    console.log(`  with a passenger capacity: ${rows.filter((r) => r.passengers).length}`);
    console.log(`  with a deadweight:         ${rows.filter((r) => r.dwt).length}`);
    console.log(`  with a displacement:       ${rows.filter((r) => r.displacement).length}`);
    console.log(`  with a yard number:    ${rows.filter((r) => r.yardNumber).length}`);
    console.log(`  with dated events:     ${rows.filter((r) => r.events.some((e) => e.year)).length}`);
    if (failed.length) process.exitCode = 1;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { OUT, TEU_UNITS, TONNE_UNITS, PASSENGER_UNITS, toTonnes };
