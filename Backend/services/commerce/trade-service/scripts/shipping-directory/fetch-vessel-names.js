'use strict';
/**
 * Stage B2 — recover names for vessels that have no English label.
 *
 * Two populations need this, and the second is the bigger one.
 *
 *   • Items with no `en` label at all. The vessel fetch asks only for English, so these
 *     arrive nameless. They are not nameless — the name is recorded in another language,
 *     and a ship's name is a proper noun, so a Norwegian or Japanese label IS the name.
 *   • Items whose label is the PLACEHOLDER "IMO 9929429". Wikidata uses that string as a
 *     stand-in label, frequently in `en` and `mul`, while the real name sits in some other
 *     language — Q117230166 labels itself "IMO 9929429" in `mul` and "MSC Irina" in `nb`.
 *     A placeholder is not a name, so it is treated as absent in both directions: it never
 *     satisfies the fetch, and it is never chosen here.
 *
 * Targeted on purpose: only affected QIDs are re-queried, rather than re-running the whole
 * 96k vessel fetch.
 *
 *   node scripts/shipping-directory/fetch-vessel-names.js [--force]
 */
const fs = require('fs');
const path = require('path');
const { sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const VESSEL_CACHE = path.join(CACHE, 'vessels');
const OUT = path.join(CACHE, 'vessel-names.json');
const UA = 'BaalvionGTI-ShippingDirectory/1.0 (https://baalvion.com; contact: infra@baalvion.com)';
const CHUNK = 50;

/**
 * Preference order. `mul` is Wikidata's explicit "same in every language" label and is
 * the best possible answer for a ship name. After that, major Latin-script languages,
 * then anything at all — a name in a non-Latin script beats no name.
 */
const PREFERRED = ['mul', 'en', 'en-gb', 'nb', 'no', 'nn', 'da', 'sv', 'nl', 'de', 'fr', 'es', 'pt', 'it', 'fi', 'et', 'pl', 'tr', 'id', 'ms'];

/**
 * "IMO 9929429" is Wikidata's placeholder label for a vessel nobody has named yet, not a
 * name. It appears in `en` and `mul` — the two highest-priority languages — so without
 * this check the preference order confidently picks the placeholder over a real name
 * sitting one row further down the list.
 */
function isPlaceholderName(name) {
    return !name || /^IMO[\s-]?\d{6,8}$/i.test(String(name).trim());
}

/**
 * Strip a trailing parenthetical from a label.
 *
 * A Wikidata label is meant to be the plain name of the thing. Where one ends in
 * parentheses it is carrying a disambiguator inherited from a Wikipedia article title —
 * "Playa de Bakio (barco)", "Huascar (Schiff, 1992)", "Bow Sea (2006)". Every one of the
 * 75 such labels in this vessel set is of that kind: a year, or the word for "ship" in
 * some language. None is part of a ship's actual name, so the parenthetical goes.
 */
function cleanVesselName(name) {
    if (!name) return name;
    const stripped = name.replace(/\s*\([^()]*\)\s*$/, '').trim();
    return stripped || name; // never let the rule empty a name out entirely
}

function pickLabel(labels) {
    const usable = (v) => v && v.value && !isPlaceholderName(cleanVesselName(v.value));
    for (const lang of PREFERRED) {
        if (usable(labels[lang])) return { name: cleanVesselName(labels[lang].value), lang };
    }
    const first = Object.values(labels).find(usable);
    return first ? { name: cleanVesselName(first.value), lang: first.language } : null;
}

function namelessQids() {
    if (!fs.existsSync(VESSEL_CACHE)) return [];
    const out = new Set();
    for (const f of fs.readdirSync(VESSEL_CACHE).filter((x) => x.endsWith('.json'))) {
        for (const v of JSON.parse(fs.readFileSync(path.join(VESSEL_CACHE, f)))) {
            if (v.qid && isPlaceholderName(v.name)) out.add(v.qid);
        }
    }
    return [...out];
}

async function fetchChunk(ids, attempts = 4) {
    // No `languages` filter: we do not know in advance which language holds the name.
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join('|')}&props=labels&format=json`;
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

async function main() {
    const force = process.argv.includes('--force');
    fs.mkdirSync(CACHE, { recursive: true });
    const existing = !force && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : {};

    const targets = namelessQids().filter((q) => !existing[q]);
    console.log(`[vessel-names] ${targets.length} vessels have no usable English name (absent or a placeholder)`);
    if (!targets.length) { console.log('[vessel-names] PASS — nothing to do'); return; }

    let failed = 0;
    for (let i = 0; i < targets.length; i += CHUNK) {
        const ids = targets.slice(i, i + CHUNK);
        try {
            const entities = await fetchChunk(ids);
            for (const [q, e] of Object.entries(entities)) {
                if (e.missing !== undefined || !e.labels) continue;
                const picked = pickLabel(e.labels);
                if (picked) existing[q] = picked;
            }
        } catch (err) {
            failed += ids.length;
            console.error(`  [FAIL] chunk @${i}: ${err.message.slice(0, 120)}`);
        }
        await sleep(120);
    }
    fs.writeFileSync(OUT, JSON.stringify(existing, null, 0));

    const recovered = targets.filter((q) => existing[q]).length;
    const byLang = {};
    for (const q of targets) if (existing[q]) byLang[existing[q].lang] = (byLang[existing[q].lang] || 0) + 1;
    console.log(`[vessel-names] ${failed ? 'FAIL' : 'PASS'} — recovered ${recovered}/${targets.length} names`);
    console.log('  by language:', Object.entries(byLang).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([l, n]) => `${l}:${n}`).join(' '));
    if (failed) process.exitCode = 1;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { OUT, pickLabel, cleanVesselName, isPlaceholderName };
