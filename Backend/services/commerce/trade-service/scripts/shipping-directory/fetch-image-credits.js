'use strict';
/**
 * Stage G — attribution for every photograph the directory shows.
 *
 * The ship photographs on this site are other people's work. Almost all of them are
 * licensed CC BY-SA or CC BY, which permit reuse *on condition* that the photographer is
 * named and the licence is stated. Publishing them bare is not a styling oversight, it is
 * a licence breach — so this stage fetches the author and licence for each file, and
 * load.js drops the image of any file it could not get a credit for.
 *
 * Commons returns the author as a fragment of HTML (an anchor to a user page, sometimes
 * a nested template with markup and a "role" caption). It is reduced to plain text here,
 * once, rather than in every template that renders a photo.
 *
 *   node scripts/shipping-directory/fetch-image-credits.js [--force] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const { sleep } = require('./wdqs');

const CACHE = path.join(__dirname, '.cache');
const VESSEL_CACHE = path.join(CACHE, 'vessels');
const COMPANIES = path.join(CACHE, 'companies.json');
const DEPTH = path.join(CACHE, 'company-depth.json');
const OUT = path.join(CACHE, 'image-credits.json');
const UA = 'BaalvionGTI-ShippingDirectory/1.0 (https://baalvion.com; contact: infra@baalvion.com)';
const CHUNK = 50;

/**
 * A Special:FilePath URL back to the "File:Foo.jpg" title the API wants.
 *
 * Wikidata percent-encodes the filename and uses %20 for spaces; Commons titles use
 * underscores or spaces interchangeably but must be DECODED before being re-encoded as a
 * titles= parameter, or the API is asked for a file literally named "Foo%20Bar.jpg" and
 * answers, correctly, that no such file exists.
 */
function fileTitleFromUrl(url) {
    if (!url) return null;
    const m = /Special:FilePath\/(.+)$/.exec(String(url));
    if (!m) return null;
    let name;
    try {
        name = decodeURIComponent(m[1]);
    } catch {
        name = m[1]; // a malformed escape sequence is not worth losing the file over
    }
    name = name.split('?')[0].replace(/_/g, ' ').trim();
    return name ? `File:${name}` : null;
}

/** Commons hands back HTML for Artist/Credit. Reduce to the plain name. */
function htmlToText(html) {
    if (!html) return null;
    const text = String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    return text || null;
}

/**
 * Licences that permit reuse on a website. A file whose licence is not recognised is not
 * assumed to be usable — it is recorded with `usable: false` and its image is not shown.
 * "Fair use" files in particular are frequently attached to company items (logos), and
 * fair use does not transfer to a third-party directory.
 */
const USABLE_LICENCE = /^(cc[- ]by([- ]sa)?([- ]\d(\.\d)?)*|cc0|cc[- ]pd|public domain|pd(-|$)|attribution)/i;

function licenceIsUsable(shortName, licence) {
    const s = `${shortName || ''} ${licence || ''}`.trim().toLowerCase();
    if (!s) return false;
    if (/fair use|non-?free|copyright(ed)?$|all rights reserved|\bnc\b|noncommercial|non-commercial|\bnd\b|no ?derivat/i.test(s)) return false;
    return USABLE_LICENCE.test(s.trim()) || /^gfdl|^public/i.test(s.trim());
}

async function fetchChunk(titles, attempts = 4) {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json'
        + '&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=1200'
        + `&titles=${titles.map(encodeURIComponent).join('|')}`;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
            if (res.status === 429) { await sleep(20000); continue; }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error.info || 'api error');
            return json.query || {};
        } catch (err) {
            if (attempt === attempts) throw err;
            await sleep(1500 * attempt);
        }
    }
    return {};
}

function creditFromPage(page) {
    const info = page.imageinfo && page.imageinfo[0];
    if (!info) return null;
    const meta = info.extmetadata || {};
    const get = (k) => (meta[k] && meta[k].value) || null;

    const shortName = htmlToText(get('LicenseShortName'));
    const licence = htmlToText(get('License'));
    return {
        author: htmlToText(get('Artist')) || htmlToText(get('Credit')),
        licence: shortName || licence,
        licenceUrl: get('LicenseUrl'),
        descriptionUrl: info.descriptionurl || null,
        // The width-limited render. Commons originals are routinely 10-20 MB scans, and a
        // directory page that ships six of them is unusable on a phone.
        thumbUrl: info.thumburl || null,
        width: info.thumbwidth || null,
        height: info.thumbheight || null,
        usable: licenceIsUsable(shortName, licence),
    };
}

function collectImageUrls(limit) {
    const urls = new Set();

    if (fs.existsSync(VESSEL_CACHE)) {
        const withImages = [];
        for (const f of fs.readdirSync(VESSEL_CACHE).filter((x) => x.endsWith('.json'))) {
            for (const v of JSON.parse(fs.readFileSync(path.join(VESSEL_CACHE, f)))) {
                if (v.imageUrl) withImages.push({ url: v.imageUrl, gt: v.grossTonnage || 0, linked: Boolean(v.operatorQid) });
            }
        }
        // Credit the photos most likely to be looked at first, so an interrupted run still
        // leaves the busiest pages complete.
        withImages.sort((a, b) => (b.linked - a.linked) || (b.gt - a.gt));
        for (const v of withImages) urls.add(v.url);
    }

    if (fs.existsSync(COMPANIES)) {
        for (const c of JSON.parse(fs.readFileSync(COMPANIES))) {
            if (c.logoUrl) urls.add(c.logoUrl);
        }
    }
    if (fs.existsSync(DEPTH)) {
        const d = JSON.parse(fs.readFileSync(DEPTH));
        for (const c of d.companies || []) if (c.imageUrl) urls.add(c.imageUrl);
        for (const e of Object.values(d.entities || {})) if (e.imageUrl) urls.add(e.imageUrl);
    }

    const list = [...urls];
    return limit ? list.slice(0, limit) : list;
}

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const limit = Number((args.find((a) => a.startsWith('--limit=')) || '').replace('--limit=', '')) || 0;
    fs.mkdirSync(CACHE, { recursive: true });

    const existing = !force && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : {};
    const urls = collectImageUrls(limit);
    const todo = urls.filter((u) => !(u in existing));
    console.log(`[image-credits] ${urls.length} distinct files referenced, ${todo.length} without a credit yet`);
    if (!todo.length) { console.log('[image-credits] PASS — nothing to do'); return; }

    // title -> the URLs that resolve to it (several items can cite the same photograph).
    const byTitle = new Map();
    for (const u of todo) {
        const t = fileTitleFromUrl(u);
        if (!t) { existing[u] = null; continue; }
        if (!byTitle.has(t)) byTitle.set(t, []);
        byTitle.get(t).push(u);
    }
    const titles = [...byTitle.keys()];

    let failed = 0;
    for (let i = 0; i < titles.length; i += CHUNK) {
        const batch = titles.slice(i, i + CHUNK);
        try {
            const q = await fetchChunk(batch);
            const alias = {};
            for (const n of q.normalized || []) alias[n.from] = n.to;
            const byName = {};
            for (const page of Object.values(q.pages || {})) {
                if (page.missing !== undefined) continue;
                byName[page.title] = page;
            }
            for (const asked of batch) {
                const page = byName[alias[asked] || asked];
                const credit = page ? creditFromPage(page) : null;
                for (const u of byTitle.get(asked)) existing[u] = credit;
            }
        } catch (err) {
            failed += batch.length;
            console.error(`\n  [FAIL] @${i}: ${err.message.slice(0, 120)}`);
        }
        process.stdout.write(`\r  ${Math.min(i + CHUNK, titles.length)}/${titles.length}`);
        // Commons is stricter than WDQS about burst rates from one agent.
        await sleep(200);
    }
    process.stdout.write('\n');
    fs.writeFileSync(OUT, JSON.stringify(existing));

    const got = todo.filter((u) => existing[u]);
    const usable = got.filter((u) => existing[u].usable);
    const withAuthor = usable.filter((u) => existing[u].author);
    console.log(`[image-credits] ${failed ? 'PARTIAL' : 'PASS'} — ${got.length}/${todo.length} files resolved`);
    console.log(`  licensed for reuse:  ${usable.length}`);
    console.log(`  with a named author: ${withAuthor.length}`);
    console.log(`  NOT shown (unusable or unknown licence): ${todo.length - usable.length}`);
    if (failed) process.exitCode = 1;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { OUT, fileTitleFromUrl, htmlToText, licenceIsUsable };
