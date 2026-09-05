'use strict';
/**
 * Stage D — resolve every QID the vessel and company caches reference into English
 * labels: ship types, flag states, ports of registry, shipyards, vessel classes,
 * company countries, headquarters and parents.
 *
 * This exists as its own pass because the label service cannot be used where the QIDs
 * were collected. `SERVICE wikibase:label` only binds variables that appear in GROUP BY,
 * so inside the aggregated vessel/company queries every ?xLabel comes back as an empty
 * string — no error, just silently blank data. Collect QIDs there, resolve them here.
 *
 * Uses wbgetentities (50 ids per call) rather than SPARQL: it is a plain key lookup, so
 * it cannot produce the cartesian blow-up that SPARQL OPTIONALs can.
 *
 *   node scripts/shipping-directory/fetch-labels.js [--force]
 */
const fs = require('fs');
const path = require('path');
const { sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const VESSEL_CACHE = path.join(CACHE, 'vessels');
const OUT = path.join(CACHE, 'labels.json');
const UA = 'BaalvionGTI-ShippingDirectory/1.0 (https://baalvion.com; contact: infra@baalvion.com)';
const CHUNK = 50;

function collectQids() {
    const set = new Set();
    const add = (q) => { if (q) set.add(q); };

    if (fs.existsSync(VESSEL_CACHE)) {
        for (const f of fs.readdirSync(VESSEL_CACHE).filter((x) => x.endsWith('.json'))) {
            for (const v of JSON.parse(fs.readFileSync(path.join(VESSEL_CACHE, f)))) {
                (v.typeQids || []).forEach(add);
                [v.flagQid, v.portQid, v.builderQid, v.classQid, v.operatorQid, v.ownerQid].forEach(add);
            }
        }
    }
    const companiesFile = path.join(CACHE, 'companies.json');
    if (fs.existsSync(companiesFile)) {
        for (const c of JSON.parse(fs.readFileSync(companiesFile))) {
            (c.typeQids || []).forEach(add);
            [c.countryQid, c.hqQid, c.parentQid].forEach(add);
        }
    }
    return [...set];
}

async function fetchChunk(ids, attempts = 4) {
    const url =
        'https://www.wikidata.org/w/api.php?action=wbgetentities' +
        `&ids=${ids.join('|')}&props=labels|claims&languages=en&format=json`;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': UA } });
            if (res.status === 429) { await sleep(20000); continue; }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error.info || 'api error');
            return json.entities || {};
        } catch (err) {
            if (attempt === attempts) throw err;
            await sleep(1500 * attempt);
        }
    }
    return {};
}

/** ISO 3166-1 alpha-2 (P297) where the entity is a country — lets vessels carry a real flag code. */
function iso2Of(entity) {
    const claims = (entity.claims && entity.claims.P297) || [];
    const v = claims[0] && claims[0].mainsnak && claims[0].mainsnak.datavalue;
    return v ? String(v.value).toUpperCase() : null;
}

async function main() {
    const force = process.argv.includes('--force');
    fs.mkdirSync(CACHE, { recursive: true });

    const existing = !force && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : {};
    const needed = collectQids().filter((q) => !existing[q]);
    console.log(`[fetch-labels] ${Object.keys(existing).length} cached, ${needed.length} to resolve`);
    if (!needed.length) { console.log('[fetch-labels] PASS — nothing to do'); return; }

    let failed = 0;
    for (let i = 0; i < needed.length; i += CHUNK) {
        const ids = needed.slice(i, i + CHUNK);
        try {
            const entities = await fetchChunk(ids);
            for (const [q, e] of Object.entries(entities)) {
                if (e.missing !== undefined) { existing[q] = { label: null, missing: true }; continue; }
                existing[q] = {
                    label: (e.labels && e.labels.en && e.labels.en.value) || null,
                    iso2: iso2Of(e),
                };
            }
        } catch (err) {
            failed += ids.length;
            console.error(`  [FAIL] chunk @${i}: ${err.message.slice(0, 120)}`);
        }
        if (i % (CHUNK * 20) === 0) {
            process.stdout.write(`\r  ${Math.min(i + CHUNK, needed.length)}/${needed.length}`);
            fs.writeFileSync(OUT, JSON.stringify(existing)); // checkpoint: a crash must not lose the run
        }
        await sleep(120);
    }
    fs.writeFileSync(OUT, JSON.stringify(existing));

    const unresolved = collectQids().filter((q) => !existing[q]);
    console.log(`\n[fetch-labels] ${failed || unresolved.length ? 'FAIL' : 'PASS'} — ${Object.keys(existing).length} labels cached, ${unresolved.length} unresolved`);
    if (failed || unresolved.length) process.exitCode = 1;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { OUT, collectQids };
