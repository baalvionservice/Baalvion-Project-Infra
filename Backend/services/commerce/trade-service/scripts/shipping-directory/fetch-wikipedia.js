'use strict';
/**
 * Stage E — the encyclopaedic prose that makes a directory entry a page.
 *
 * A company page assembled purely from Wikidata statements is a spec sheet: correct,
 * and unreadable. What a reader actually wants first is a paragraph telling them what
 * this company IS. That paragraph exists, it is written by people, and it is licensed
 * for reuse — so it is QUOTED from Wikipedia, with its article title, URL and fetch date
 * stored beside it, rather than written here.
 *
 * NOTHING IS GENERATED IN THIS FILE. Where an article does not exist, the company has no
 * summary and the page renders without that section. That is the correct outcome; a
 * plausible-sounding paragraph assembled from the statement values would be indistinguishable
 * from a real one to a reader and is exactly what this directory refuses to do.
 *
 * Two hops, because Wikidata knows the article's title and Wikipedia knows its text:
 *   1. wbgetentities + sitefilter=enwiki   -> the article title for each QID
 *   2. action=query&prop=extracts&exintro  -> the lead section, plain text
 *
 * Extracts are capped at 20 titles per request by the API (exlimit), and the cap is
 * silently enforced rather than reported, so the batch size here is not a tuning knob.
 *
 *   node scripts/shipping-directory/fetch-wikipedia.js [--ships] [--force] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const { sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const COMPANIES = path.join(CACHE, 'companies.json');
const VESSEL_CACHE = path.join(CACHE, 'vessels');
const OUT_COMPANIES = path.join(CACHE, 'wikipedia-companies.json');
const OUT_VESSELS = path.join(CACHE, 'wikipedia-vessels.json');
const UA = 'BaalvionGTI-ShippingDirectory/1.0 (https://baalvion.com; contact: infra@baalvion.com)';

const SITELINK_CHUNK = 50; // wbgetentities cap
const EXTRACT_CHUNK = 20;  // exlimit cap — enforced silently, do not raise

async function apiGet(url, attempts = 4) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
            if (res.status === 429) { await sleep(20000); continue; }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error.info || 'api error');
            return json;
        } catch (err) {
            if (attempt === attempts) throw err;
            await sleep(1500 * attempt);
        }
    }
    return null;
}

/** QID -> English Wikipedia article title, for the items that have one. */
async function resolveTitles(qids) {
    const out = {};
    let failed = 0;
    for (let i = 0; i < qids.length; i += SITELINK_CHUNK) {
        const ids = qids.slice(i, i + SITELINK_CHUNK);
        const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join('|')}`
            + '&props=sitelinks&sitefilter=enwiki&format=json';
        try {
            const json = await apiGet(url);
            for (const [q, e] of Object.entries(json.entities || {})) {
                const link = e.sitelinks && e.sitelinks.enwiki;
                if (link && link.title) out[q] = link.title;
            }
        } catch (err) {
            failed += ids.length;
            console.error(`  [FAIL] sitelinks @${i}: ${err.message.slice(0, 120)}`);
        }
        process.stdout.write(`\r  titles ${Math.min(i + SITELINK_CHUNK, qids.length)}/${qids.length}`);
        await sleep(120);
    }
    process.stdout.write('\n');
    return { titles: out, failed };
}

/**
 * The lead section as plain text.
 *
 * `redirects=1` matters: a Wikidata sitelink can point at a title that has since been
 * redirected, and without it the API returns a page with no extract and no error — the
 * article silently reads as absent. The response maps normalised/redirected titles back
 * to what was asked for, so the mapping is followed rather than assumed to be identity.
 */
async function fetchExtracts(titles) {
    const out = {};
    let failed = 0;
    for (let i = 0; i < titles.length; i += EXTRACT_CHUNK) {
        const batch = titles.slice(i, i + EXTRACT_CHUNK);
        const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1'
            + '&prop=extracts|info&inprop=url&exintro=1&explaintext=1&exlimit=20'
            + `&titles=${batch.map(encodeURIComponent).join('|')}`;
        try {
            const json = await apiGet(url);
            const q = json.query || {};
            // title-as-asked -> title-as-returned, following normalisation then redirects.
            const alias = {};
            for (const n of q.normalized || []) alias[n.from] = n.to;
            for (const r of q.redirects || []) alias[r.from] = r.to;
            const resolve = (t) => { let cur = t; for (let h = 0; h < 4 && alias[cur]; h += 1) cur = alias[cur]; return cur; };

            const byTitle = {};
            for (const page of Object.values(q.pages || {})) {
                if (page.missing !== undefined) continue;
                byTitle[page.title] = page;
            }
            for (const asked of batch) {
                const page = byTitle[resolve(asked)];
                if (!page || !page.extract) continue;
                out[asked] = {
                    title: page.title,
                    url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
                    extract: page.extract.trim(),
                };
            }
        } catch (err) {
            failed += batch.length;
            console.error(`  [FAIL] extracts @${i}: ${err.message.slice(0, 120)}`);
        }
        process.stdout.write(`\r  extracts ${Math.min(i + EXTRACT_CHUNK, titles.length)}/${titles.length}`);
        await sleep(140);
    }
    process.stdout.write('\n');
    return { extracts: out, failed };
}

/**
 * A lead section can be one clause or fifteen paragraphs. Company pages want a readable
 * opening, not a transplanted article, so the extract is trimmed to whole sentences under
 * a length budget — never mid-sentence, and never with an ellipsis that implies the
 * source trailed off. Below the floor the extract is dropped: a two-word stub reads as
 * broken page furniture rather than as content.
 */
const MIN_CHARS = 60;
const MAX_CHARS = 1400;

function trimToSentences(text, max = MAX_CHARS) {
    const clean = String(text).replace(/\s*\n\s*/g, '\n').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'), cut.lastIndexOf('。'));
    return lastStop > max * 0.4 ? cut.slice(0, lastStop + 1).trim() : cut.trim();
}

function vesselQidsWorthFetching(limit) {
    if (!fs.existsSync(VESSEL_CACHE)) return [];
    const all = [];
    for (const f of fs.readdirSync(VESSEL_CACHE).filter((x) => x.endsWith('.json'))) {
        for (const v of JSON.parse(fs.readFileSync(path.join(VESSEL_CACHE, f)))) {
            if (!v.qid || !v.imo) continue;
            // A ship worth a written page is one somebody photographed, one big enough to
            // be notable, or one attributed to a fleet. Fetching all 96k articles that
            // mostly do not exist would be 5,000 requests to learn "no".
            const notable = Boolean(v.imageUrl) || (v.grossTonnage || 0) >= 50000 || Boolean(v.operatorQid);
            if (notable) all.push({ qid: v.qid, gt: v.grossTonnage || 0, hasImage: Boolean(v.imageUrl) });
        }
    }
    all.sort((a, b) => (b.hasImage - a.hasImage) || (b.gt - a.gt));
    return (limit ? all.slice(0, limit) : all).map((v) => v.qid);
}

async function run(qids, outFile, label, force) {
    const existing = !force && fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile)) : {};
    const todo = qids.filter((q) => !(q in existing));
    console.log(`[wikipedia:${label}] ${qids.length} candidates, ${todo.length} to fetch`);
    if (!todo.length) return existing;

    const { titles, failed: tf } = await resolveTitles(todo);
    const titleList = [...new Set(Object.values(titles))];
    console.log(`[wikipedia:${label}] ${titleList.length} have an English Wikipedia article`);

    const { extracts, failed: ef } = await fetchExtracts(titleList);

    let kept = 0;
    let tooShort = 0;
    for (const q of todo) {
        const t = titles[q];
        const got = t && extracts[t];
        if (!got) { existing[q] = null; continue; } // Record the miss so a re-run does not ask again
        const trimmed = trimToSentences(got.extract);
        if (trimmed.length < MIN_CHARS) { tooShort += 1; existing[q] = null; continue; }
        existing[q] = { title: got.title, url: got.url, summary: trimmed };
        kept += 1;
    }
    fs.writeFileSync(outFile, JSON.stringify(existing));
    console.log(`[wikipedia:${label}] ${tf + ef ? 'PARTIAL' : 'PASS'} — ${kept} summaries kept, ${tooShort} rejected as too short, ${tf + ef} lookups failed`);
    return existing;
}

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const doShips = args.includes('--ships');
    const limit = Number((args.find((a) => a.startsWith('--limit=')) || '').replace('--limit=', '')) || 0;
    fs.mkdirSync(CACHE, { recursive: true });

    if (!doShips) {
        const companies = JSON.parse(fs.readFileSync(COMPANIES));
        const ordered = [...companies].sort((a, b) => (b.sitelinks || 0) - (a.sitelinks || 0));
        const qids = (limit ? ordered.slice(0, limit) : ordered).map((c) => c.qid).filter(Boolean);
        await run(qids, OUT_COMPANIES, 'companies', force);
    } else {
        await run(vesselQidsWorthFetching(limit), OUT_VESSELS, 'vessels', force);
    }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { OUT_COMPANIES, OUT_VESSELS, trimToSentences, vesselQidsWorthFetching };
