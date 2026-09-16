'use strict';
/**
 * Stage J — the Wikipedia ship infobox.
 *
 * WHY THIS EXISTS. The comparison against what already ranks for a vessel query was
 * unflattering: MarineTraffic and the rest publish deadweight, owner, ISM manager, beam
 * and a real type where this registry had blanks and `other`. Wikidata does not hold
 * those fields for most hulls, and the obvious commercial source does not permit it —
 * Equasis's conditions of registration explicitly forbid an API, a hyperlink-extractor or
 * bulk download, so that route is closed regardless of budget.
 *
 * The infobox is the third option. `{{Infobox ship characteristics}}` carries exactly the
 * missing fields, it is CC BY-SA like the prose we already quote, and the API serves it
 * as wikitext. Coverage is the honest limit: 3,338 of 95,871 vessels have an English
 * article, so this improves 3.5% of the fleet. That 3.5% is not arbitrary though — it is
 * the notable ships, which are also the ones carrying photographs and the only ones with
 * a realistic chance of ranking.
 *
 * PARSING IS THE RISK HERE, so it is deliberately conservative. Wikitext is not a data
 * format: a value can be a template, a citation, a bulleted list of three different
 * figures, or prose. Anything this file cannot parse to an unambiguous number is DROPPED,
 * never guessed at. A wrong deadweight published as fact is worse than a blank.
 *
 *   node scripts/shipping-directory/fetch-infoboxes.js [--force] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const { sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const WP_VESSELS = path.join(CACHE, 'wikipedia-vessels.json');
const OUT = path.join(CACHE, 'infoboxes.json');
const UA = 'BaalvionGTI-ShippingDirectory/1.0 (https://baalvion.com; contact: infra@baalvion.com)';

/** Strip citations, comments and HTML that surround an otherwise usable value. */
function stripMarkup(v) {
    return String(v || '')
        .replace(/<ref[^>]*\/>/gi, '')
        .replace(/<ref[\s\S]*?<\/ref>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .trim();
}

/**
 * A wikitext value reduced to plain text.
 *
 * Three things bite here and all three were seen in the first 60 articles:
 *   • [[File:Flag.svg|border|20px]] leaves "border|20px" glued to the name, so an
 *     operator published as "border|20px Royal Caribbean International".
 *   • A value is often a bulleted history — three owners with date ranges. The FIRST
 *     bullet is the current one by convention; joining them produces nonsense.
 *   • Templates that are not values ({{flagicon}}, {{sfn}}) survive stripMarkup.
 */
function unlink(v) {
    let t = stripMarkup(v);
    // File/image links first — their pipe-separated options are not part of any name.
    t = t.replace(/\[\[\s*(?:File|Image)\s*:[^\]]*\]\]/gi, ' ');
    t = t.replace(/\{\{[^{}]*\}\}/g, ' ');
    // A bulleted list: keep the first entry only.
    const bullets = t.split(/\n\s*\*/).map((x) => x.trim()).filter(Boolean);
    if (bullets.length > 1) t = bullets[0].replace(/^\*/, '');
    t = t.split('\n')[0];
    return t
        .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
        .replace(/\[\[([^\]]*)\]\]/g, '$1')
        .replace(/'''?/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[\s,;|]+|[\s,;|]+$/g, '')
        .trim();
}

/**
 * The first number a value states, in the unit the template names.
 *
 * Handles the four shapes that actually occur: {{GT|220940}}, {{TEU|20,124}},
 * {{convert|58.8|m|ftin}}, and a bare "199,692". A bulleted list takes its FIRST entry,
 * which by convention is the primary figure. Returns null on anything else.
 */
function firstNumber(value) {
    const v = stripMarkup(value);
    if (!v) return null;
    const line = v.split(/\n?\s*\*/).filter((x) => x.trim())[0] || v;

    const tpl = /\{\{\s*(GT|NT|DWT|TEU|convert|cvt)\s*\|\s*([\d,.]+)/i.exec(line);
    if (tpl) {
        const n = Number(tpl[2].replace(/,/g, ''));
        return Number.isFinite(n) ? n : null;
    }
    const bare = /(-?[\d][\d,]*\.?\d*)/.exec(line.replace(/\{\{[^}]*\}\}/g, ' '));
    if (!bare) return null;
    const n = Number(bare[1].replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
}

/**
 * Tonnage is a single field carrying several measurements, one per bullet:
 *   *{{GT|220940}}  *{{NT|99155}}  *{{DWT|199692}}
 * so each is read by its own template rather than by position.
 */
function parseTonnage(value) {
    const v = stripMarkup(value);
    const out = {};
    for (const [key, re] of [
        ['gt', /\{\{\s*GT\s*\|\s*([\d,.]+)/i],
        ['nt', /\{\{\s*NT\s*\|\s*([\d,.]+)/i],
        ['dwt', /\{\{\s*DWT\s*\|\s*([\d,.]+)/i],
    ]) {
        const m = re.exec(v);
        if (m) {
            const n = Number(m[1].replace(/,/g, ''));
            if (Number.isFinite(n)) out[key] = n;
        }
    }
    // "199,692 DWT" / "220,940 GT" written out rather than templated.
    for (const [key, re] of [
        ['dwt', /([\d][\d,]*)\s*(?:tonnes?\s*)?(?:DWT|deadweight)/i],
        ['gt', /([\d][\d,]*)\s*(?:GT|gross tons?|gross tonnage)/i],
    ]) {
        if (out[key] === undefined) {
            const m = re.exec(v);
            if (m) {
                const n = Number(m[1].replace(/,/g, ''));
                if (Number.isFinite(n)) out[key] = n;
            }
        }
    }
    return out;
}

/** Capacity, only where the unit is unambiguous — same rule as the Wikidata side. */
function parseCapacity(value) {
    const v = stripMarkup(value);
    const teu = /\{\{\s*TEU\s*\|\s*([\d,.]+)/i.exec(v) || /([\d][\d,]*)\s*TEU\b/i.exec(v);
    if (teu) {
        const n = Number(teu[1].replace(/,/g, ''));
        if (Number.isFinite(n)) return { teu: n };
    }
    const pax = /([\d][\d,]*)\s*(?:passengers|pax)\b/i.exec(v);
    if (pax) {
        const n = Number(pax[1].replace(/,/g, ''));
        if (Number.isFinite(n)) return { passengers: n };
    }
    return {};
}

/** `| key = value` out of a section-0 wikitext blob, brace-aware. */
function infoboxFields(wikitext) {
    const fields = {};
    const lines = String(wikitext || '').split('\n');
    let current = null;
    for (const line of lines) {
        const m = /^\s*\|\s*([A-Za-z][A-Za-z0-9 _-]*?)\s*=\s*(.*)$/.exec(line);
        if (m) {
            current = m[1].trim().toLowerCase().replace(/^ship\s+/, '');
            fields[current] = m[2];
        } else if (current && /^\s*[*|]/.test(line) === false && line.trim() && !/^\s*\}\}/.test(line)) {
            // A value continued onto the next line (common for bulleted tonnage lists).
            fields[current] += `\n${line}`;
        } else if (current && /^\s*\*/.test(line)) {
            fields[current] += `\n${line}`;
        }
    }
    return fields;
}

async function fetchSection0(title, attempts = 4) {
    const url = 'https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext&section=0&format=json&redirects=1'
        + `&page=${encodeURIComponent(title)}`;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
            if (res.status === 429) { await sleep(20000); continue; }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.error) return null; // a missing page is an answer, not a failure
            return (json.parse && json.parse.wikitext && json.parse.wikitext['*']) || null;
        } catch (err) {
            if (attempt === attempts) throw err;
            await sleep(1500 * attempt);
        }
    }
    return null;
}

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const limit = Number((args.find((a) => a.startsWith('--limit=')) || '').replace('--limit=', '')) || 0;

    if (!fs.existsSync(WP_VESSELS)) {
        console.error('[infoboxes] wikipedia-vessels.json missing — run fetch-wikipedia.js --ships first');
        process.exit(1);
    }
    const articles = JSON.parse(fs.readFileSync(WP_VESSELS));
    const existing = !force && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : {};

    const targets = Object.entries(articles)
        .filter(([qid, a]) => a && a.title && !(qid in existing))
        .map(([qid, a]) => ({ qid, title: a.title }));
    const todo = limit ? targets.slice(0, limit) : targets;

    console.log(`[infoboxes] ${todo.length} articles to read (of ${targets.length} with an article)`);
    if (!todo.length) { console.log('[infoboxes] PASS — nothing to do'); return; }

    /**
     * Concurrency and incremental saves.
     *
     * Serial with a 120ms pause is ~1 request/second against a ~900ms round trip, which
     * is 50 minutes for 3,276 articles — and the original wrote the cache only after the
     * loop, so an interruption anywhere in those 50 minutes threw away every result. Both
     * are fixed here: a small worker pool (Wikipedia is fine with this from one clearly
     * identified agent) and a checkpoint every 250 articles, so a re-run resumes rather
     * than restarts.
     */
    const CONCURRENCY = 6;
    const CHECKPOINT_EVERY = 250;
    let failed = 0;
    let done = 0;

    const processOne = async ({ qid, title }) => {
        try {
            const wikitext = await fetchSection0(title);
            if (!wikitext) { existing[qid] = null; done += 1; return; }
            const f = infoboxFields(wikitext);

            const tonnage = parseTonnage(f.tonnage);
            const capacity = parseCapacity(f.capacity);
            const row = {
                title,
                type: f.type ? unlink(f.type).slice(0, 120) : null,
                owner: f.owner ? unlink(f.owner).slice(0, 160) : null,
                operator: f.operator ? unlink(f.operator).slice(0, 160) : null,
                builder: f.builder ? unlink(f.builder).slice(0, 160) : null,
                yardNumber: f['yard number'] ? unlink(f['yard number']).slice(0, 40) : null,
                homePort: f['port of registry'] ? unlink(f['port of registry']).slice(0, 120) : null,
                gt: tonnage.gt ?? null,
                nt: tonnage.nt ?? null,
                dwt: tonnage.dwt ?? null,
                teu: capacity.teu ?? null,
                passengers: capacity.passengers ?? null,
                beamM: f.beam ? firstNumber(f.beam) : null,
                draftM: f.draught ? firstNumber(f.draught) : (f.draft ? firstNumber(f.draft) : null),
                lengthM: f.length ? firstNumber(f.length) : null,
            };
            // Keep the row only if it actually yielded something.
            existing[qid] = Object.values(row).some((v) => v !== null && v !== title) ? row : null;
        } catch (err) {
            failed += 1;
            console.error(`\n  [FAIL] ${title}: ${err.message.slice(0, 100)}`);
        }
        done += 1;
        if (done % 25 === 0) process.stdout.write(`\r  ${done}/${todo.length}`);
        if (done % CHECKPOINT_EVERY === 0) fs.writeFileSync(OUT, JSON.stringify(existing));
    };

    const queue = [...todo];
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length) {
            const item = queue.shift();
            if (!item) break;
            await processOne(item);
            await sleep(80);
        }
    }));
    process.stdout.write('\n');
    fs.writeFileSync(OUT, JSON.stringify(existing));

    const got = Object.values(existing).filter(Boolean);
    const count = (k) => got.filter((r) => r[k] !== null && r[k] !== undefined).length;
    console.log(`[infoboxes] ${failed ? 'PARTIAL' : 'PASS'} — ${got.length} infoboxes parsed`);
    console.log(`  with a stated type: ${count('type')}`);
    console.log(`  with deadweight:    ${count('dwt')}`);
    console.log(`  with TEU:           ${count('teu')}`);
    console.log(`  with an owner:      ${count('owner')}`);
    console.log(`  with an operator:   ${count('operator')}`);
    console.log(`  with a beam:        ${count('beamM')}`);
    if (failed) process.exitCode = 1;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { OUT, infoboxFields, parseTonnage, parseCapacity, firstNumber, unlink };
