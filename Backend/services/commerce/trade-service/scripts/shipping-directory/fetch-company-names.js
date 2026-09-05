'use strict';
/**
 * Stage C3 — recover names for companies that have no English label.
 *
 * Same defect as stage B2 hit on vessels, on the other table. fetch-companies.js asks for
 * `FILTER(LANG(?nameV) = "en")`, so a company whose label lives only in `nb`, `mul` or
 * `de` arrives nameless and load.js falls back to the QID — which is why the directory
 * was publishing "Q57315691" as the name of a shipping company with 56 ships attributed.
 * It is Wilhelmsen Ship Management Sdn. Bhd., and Wikidata has always known that; nobody
 * asked in Norwegian.
 *
 * Unlike a ship's name, a company name is NOT language-independent — "Deutsche Post" and
 * "Correos" are the names, but a Chinese or Russian label may be a translation of a name
 * whose real form is Latin-script. So the preference order puts `mul` (explicitly
 * language-independent) and Latin-script European languages first, and a non-Latin label
 * is accepted only as a last resort, recorded with the language it came from so the page
 * can say so.
 *
 *   node scripts/shipping-directory/fetch-company-names.js [--force]
 */
const fs = require('fs');
const path = require('path');
const { sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const COMPANIES = path.join(CACHE, 'companies.json');
const OUT = path.join(CACHE, 'company-names.json');
const UA = 'BaalvionGTI-ShippingDirectory/1.0 (https://baalvion.com; contact: infra@baalvion.com)';
const CHUNK = 50;

const PREFERRED = [
    'mul', 'en', 'en-gb', 'nb', 'no', 'nn', 'da', 'sv', 'is', 'fi',
    'nl', 'de', 'fr', 'es', 'pt', 'it', 'ca', 'et', 'lv', 'lt',
    'pl', 'cs', 'sk', 'sl', 'hr', 'hu', 'ro', 'tr', 'id', 'ms', 'vi', 'tl',
];

/** Latin-script check — a label that is mostly CJK/Cyrillic/Arabic is a translation of
 *  the name, not the name, so it is only used when nothing else exists. */
function isLatin(s) {
    const letters = String(s).replace(/[^\p{L}]/gu, '');
    if (!letters) return false;
    const latin = letters.replace(/[^\p{Script=Latin}]/gu, '');
    return latin.length / letters.length >= 0.6;
}

/**
 * A label that is just the QID back at us, or a Wikidata maintenance placeholder, is not
 * a name. Same rule as the vessel side, different placeholder shapes.
 */
function isPlaceholderCompanyName(name) {
    if (!name) return true;
    const t = String(name).trim();
    return t === '' || /^Q\d+$/.test(t) || /^(unnamed|unknown|no label)$/i.test(t);
}

/**
 * Wikidata company labels inherit Wikipedia disambiguators — "Evergreen (company)",
 * "Hapag-Lloyd (Reederei)", "Stena Line (1962)". The parenthetical is the disambiguator,
 * never part of the registered name.
 */
function cleanCompanyName(name) {
    if (!name) return name;
    const stripped = String(name).replace(/\s*\([^()]*\)\s*$/, '').trim();
    return stripped || String(name).trim();
}

function pickLabel(labels) {
    const usable = (v) => v && v.value && !isPlaceholderCompanyName(cleanCompanyName(v.value));
    for (const lang of PREFERRED) {
        if (usable(labels[lang]) && isLatin(labels[lang].value)) {
            return { name: cleanCompanyName(labels[lang].value), lang, latin: true };
        }
    }
    // Any Latin-script label at all, before falling back to another script.
    const latin = Object.values(labels).find((v) => usable(v) && isLatin(v.value));
    if (latin) return { name: cleanCompanyName(latin.value), lang: latin.language, latin: true };
    const any = Object.values(labels).find(usable);
    return any ? { name: cleanCompanyName(any.value), lang: any.language, latin: false } : null;
}

async function fetchChunk(ids, attempts = 4) {
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
    if (!fs.existsSync(COMPANIES)) {
        console.error('[company-names] companies.json missing — run fetch-companies.js first');
        process.exit(1);
    }
    const existing = !force && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : {};
    const companies = JSON.parse(fs.readFileSync(COMPANIES));

    const targets = companies
        .filter((c) => isPlaceholderCompanyName(c.name) && isPlaceholderCompanyName(c.officialName))
        .map((c) => c.qid)
        .filter((q) => q && !existing[q]);

    console.log(`[company-names] ${targets.length} companies have no usable English name`);
    if (!targets.length) { console.log('[company-names] PASS — nothing to do'); return; }

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
    fs.writeFileSync(OUT, JSON.stringify(existing));

    const recovered = targets.filter((q) => existing[q]);
    const byLang = {};
    for (const q of recovered) byLang[existing[q].lang] = (byLang[existing[q].lang] || 0) + 1;
    const nonLatin = recovered.filter((q) => !existing[q].latin).length;
    console.log(`[company-names] ${failed ? 'FAIL' : 'PASS'} — recovered ${recovered.length}/${targets.length}`);
    console.log('  by language:', Object.entries(byLang).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([l, n]) => `${l}:${n}`).join(' '));
    console.log(`  non-Latin script (labelled as such on the page): ${nonLatin}`);
    if (failed) process.exitCode = 1;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { OUT, pickLabel, cleanCompanyName, isPlaceholderCompanyName };
