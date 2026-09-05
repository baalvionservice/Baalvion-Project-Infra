'use strict';
/**
 * Stage E — the published fleet sizes.
 *
 * WHY THIS STAGE EXISTS AT ALL. Counting the vessels we hold gives a real number that is
 * also a severe undercount: Wikidata links an operator to only ~6.3k of its ~90k
 * IMO-numbered ships, so a counted fleet puts MSC at roughly 44 ships when it runs about
 * a thousand. Publishing that as "how many ships this company owns" is simply false, so
 * the directory carries the industry's own published figure alongside the counted one,
 * and every published figure lands with its source name, URL and as-of date attached.
 *
 * Source: Wikipedia's "List of largest container shipping companies", which reproduces
 * the Alphaliner Top 100 (TEU capacity, ship count, market share) with a dated citation.
 * Alphaliner's own page renders its table in JavaScript and returns no rows to a plain
 * fetch, so the Wikipedia mirror is the machine-readable route to the same figures.
 *
 * Container lines only — this is a container-capacity ranking, so bulk, tanker and cruise
 * operators get no reported figure and stay unranked rather than being shown as "last".
 *
 *   node scripts/shipping-directory/fetch-reported-fleets.js [--force]
 */
const fs = require('fs');
const path = require('path');
const { sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const OUT = path.join(CACHE, 'reported-fleets.json');
const PAGE = 'List of largest container shipping companies';
const PAGE_URL = 'https://en.wikipedia.org/wiki/List_of_largest_container_shipping_companies';
const UA = 'BaalvionGTI-ShippingDirectory/1.0 (https://baalvion.com; contact: infra@baalvion.com)';

async function api(params) {
    const url = 'https://en.wikipedia.org/w/api.php?format=json&' + new URLSearchParams(params);
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

const stripMarkup = (s) =>
    s
        .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
        .replace(/<ref[^>]*\/>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/'{2,}/g, '')
        .trim();

/** `[[Maersk Line|Maersk]] (APM)` -> { title: 'Maersk Line', display: 'Maersk (APM)' } */
function parseCompanyCell(cell) {
    const text = stripMarkup(cell);
    const link = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(cell);
    return {
        title: link ? link[1].trim() : null,
        display: text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1').trim(),
    };
}

const toInt = (s) => {
    const n = Number(stripMarkup(s).replace(/[,\s]/g, ''));
    return Number.isFinite(n) ? n : null;
};

function parseTable(wikitext) {
    // The as-of date is prose, not a field: "...as of April 2026, according to ''Alphaliner''".
    const asOfProse = /as of ([A-Z][a-z]+ \d{4})/.exec(wikitext);
    const accessDate = /access-date=(\d{4}-\d{2}-\d{2})/.exec(wikitext);
    const asOf = accessDate ? accessDate[1] : null;

    const table = /\{\|[\s\S]*?\n\|\}/.exec(wikitext);
    if (!table) throw new Error('table not found — Wikipedia layout changed');

    const rows = [];
    for (const chunk of table[0].split('\n|-')) {
        const rank = /^\s*!\s*(\d+)/.exec(chunk);
        if (!rank) continue;
        // Cells are '|'-led lines; a leading '!' line is the rank header cell.
        const cells = chunk
            .split('\n')
            .slice(1)
            .filter((l) => l.startsWith('|'))
            .map((l) => l.replace(/^\|\s*/, '').replace(/^style="[^"]*"\s*\|\s*/, ''));
        if (cells.length < 5) continue;

        const company = parseCompanyCell(cells[0]);
        const hqMatch = /\{\{[Ff]lag\|([^}|]+)/.exec(cells[1]);
        rows.push({
            rank: Number(rank[1]),
            wikiTitle: company.title,
            displayName: company.display,
            headquarters: hqMatch ? hqMatch[1].trim() : stripMarkup(cells[1]) || null,
            teu: toInt(cells[2]),
            ships: toInt(cells[3]),
            marketSharePct: (() => {
                const m = /([\d.]+)\s*%/.exec(stripMarkup(cells[4]));
                return m ? Number(m[1]) : null;
            })(),
            alliance: cells[6] ? stripMarkup(cells[6]).replace(/\[\[|\]\]/g, '') || null : null,
        });
    }
    return { rows, asOf, asOfProse: asOfProse ? asOfProse[1] : null };
}

/** Wikipedia page title -> Wikidata QID, so these figures attach to the right company row. */
async function resolveQids(titles) {
    const out = {};
    for (let i = 0; i < titles.length; i += 40) {
        const batch = titles.slice(i, i + 40);
        const json = await api({
            action: 'query',
            prop: 'pageprops',
            ppprop: 'wikibase_item',
            redirects: '1',
            titles: batch.join('|'),
        });
        const q = json.query || {};
        const normalised = new Map();
        for (const r of [...(q.redirects || []), ...(q.normalized || [])]) normalised.set(r.from, r.to);
        const byTitle = new Map();
        for (const p of Object.values(q.pages || {})) {
            if (p.pageprops && p.pageprops.wikibase_item) byTitle.set(p.title, p.pageprops.wikibase_item);
        }
        for (const t of batch) {
            let resolved = t;
            for (let hop = 0; hop < 3 && normalised.has(resolved); hop += 1) resolved = normalised.get(resolved);
            if (byTitle.has(resolved)) out[t] = byTitle.get(resolved);
        }
        await sleep(200);
    }
    return out;
}

async function main() {
    const force = process.argv.includes('--force');
    fs.mkdirSync(CACHE, { recursive: true });
    if (fs.existsSync(OUT) && !force) { console.log('[reported-fleets] cache present, --force to refetch'); return; }

    const json = await api({ action: 'parse', page: PAGE, prop: 'wikitext' });
    if (json.error) throw new Error(json.error.info);
    const { rows, asOf, asOfProse } = parseTable(json.parse.wikitext['*']);
    console.log(`[reported-fleets] parsed ${rows.length} carriers (as of ${asOfProse || '?'}, access-date ${asOf || '?'})`);
    if (!rows.length) throw new Error('parsed zero rows — refusing to write an empty source file');

    const qids = await resolveQids(rows.map((r) => r.wikiTitle).filter(Boolean));
    let matched = 0;
    for (const r of rows) {
        r.qid = (r.wikiTitle && qids[r.wikiTitle]) || null;
        if (r.qid) matched += 1;
    }

    const payload = {
        source: 'Alphaliner Top 100 (via Wikipedia)',
        sourceUrl: PAGE_URL,
        upstreamUrl: 'https://alphaliner.axsmarine.com/PublicTop100/',
        asOf,
        asOfProse,
        fetchedAt: new Date().toISOString(),
        rows,
    };
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));

    const unmatched = rows.filter((r) => !r.qid);
    console.log(`[reported-fleets] ${unmatched.length ? 'WARN' : 'PASS'} — ${matched}/${rows.length} matched to Wikidata`);
    for (const r of unmatched) console.log(`  unmatched: ${r.displayName}`);
    for (const r of rows.slice(0, 5)) console.log(`  #${r.rank} ${r.displayName} — ${r.ships} ships, ${r.teu} TEU, ${r.marketSharePct}% (${r.qid})`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { OUT, parseTable };
