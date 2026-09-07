'use strict';
/**
 * Shared plumbing for the SEC Form D ingests (investors and operating companies).
 *
 * Both sides read the same quarterly datasets and hit the same encoding quirks, so the download,
 * the TSV reader and the date/number/URL conventions live here — two copies would drift and one
 * would quietly start reporting different numbers from the same filing.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const UA = process.env.SEC_USER_AGENT || 'Baalvion Directory mumbai.neverendservices@gmail.com';
const BASE = 'https://www.sec.gov/files';
// The SEC moved this folder mid-2026; try the newer path first, fall back to the old one.
const PATHS = ['datastandardsinnovation/data/form-d-data-sets', 'structureddata/data/form-d-data-sets'];
const CACHE = path.join(os.tmpdir(), 'baalvion-formd');

// Newest first. The current quarter is not published until it closes, so callers ask for extras
// and count only the ones that resolve.
function recentQuarters(n) {
    const out = [];
    const now = new Date();
    let y = now.getUTCFullYear();
    let q = Math.floor(now.getUTCMonth() / 3) + 1;
    for (let i = 0; i < n; i++) {
        out.push(`${y}q${q}`);
        q -= 1;
        if (q === 0) { q = 4; y -= 1; }
    }
    return out;
}

function fetchQuarter(qtr) {
    fs.mkdirSync(CACHE, { recursive: true });
    const dir = path.join(CACHE, qtr);
    if (fs.existsSync(path.join(dir, '.ok'))) return dir;
    const zip = path.join(CACHE, `${qtr}.zip`);
    let got = false;
    for (const p of PATHS) {
        try {
            execFileSync('curl', ['-sSf', '-A', UA, '--max-time', '240', '-o', zip, `${BASE}/${p}/${qtr}_d.zip`], { stdio: 'pipe' });
            if (fs.statSync(zip).size > 100_000) { got = true; break; }
        } catch { /* try the next path */ }
    }
    if (!got) return null;
    fs.mkdirSync(dir, { recursive: true });
    execFileSync('unzip', ['-o', '-q', '-j', zip, '-d', dir]);
    fs.writeFileSync(path.join(dir, '.ok'), '');
    fs.unlinkSync(zip);
    return dir;
}

// Values in these files are unquoted, so a plain split is correct and ~20x faster than a full
// CSV parser across dozens of quarters.
function readTsv(file) {
    if (!fs.existsSync(file)) return [];
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const head = lines[0].replace(/\r$/, '').split('\t');
    const out = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cells = lines[i].replace(/\r$/, '').split('\t');
        const o = {};
        for (let c = 0; c < head.length; c++) o[head[c]] = cells[c] ?? '';
        out.push(o);
    }
    return out;
}

const num = (v) => {
    const raw = String(v ?? '').trim();
    if (!raw) return null;
    const n = Number(raw.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : null;
};
const intOr = (v) => { const n = parseInt(String(v ?? ''), 10); return Number.isFinite(n) ? n : null; };

// Submissions write 15-JUN-2026; offerings write 2026-04-03. Datasets before 2020q3 write the
// submission date as an ISO timestamp ("2019-03-29 17:29:14") — anchoring on the date alone
// dropped every one of those to null, so keep the date and discard the time.
const MONTHS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
function isoDate(v) {
    const s = String(v || '').trim();
    if (!s) return null;
    const iso = s.match(/^(\d{4}-\d{2}-\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/);
    if (iso) return iso[1];
    const m = s.match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/i);
    if (m) return `${m[3]}-${MONTHS[m[2].toUpperCase()] || '01'}-${m[1].padStart(2, '0')}`;
    return null;
}

const edgarUrl = (cik, accession) => {
    const a = String(accession || '').replace(/-/g, '');
    const c = String(cik || '').replace(/^0+/, '');
    return c && a ? `https://www.sec.gov/Archives/edgar/data/${c}/${a}/${accession}-index.htm` : null;
};

// Filings shout their names ("TRUMBULL PROPERTY"); the directory should not. Short all-caps
// tokens that were all-caps in the source are kept, so LSV/ISQ/KKR survive.
function titleCase(s, original) {
    const shouting = original && original === original.toUpperCase();
    const keep = new Set(
        shouting ? [] : String(original || '').split(/\s+/).filter((w) => /^[A-Z0-9&.]{2,5}$/.test(w)).map((w) => w.replace(/[.,]$/, '')),
    );
    return String(s || '').split(/\s+/).map((w) => {
        const bare = w.replace(/[.,]$/, '');
        if (keep.has(bare)) return w;
        if (/^(ii|iii|iv|vi|vii|viii|ix|xi|xii)$/i.test(bare)) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
}

// The "related person" slot is routinely filled with the GP or management entity rather than a
// human. A name carrying a legal suffix or a fund-structure word is an entity; listing it as a
// person would misattribute a company's leadership.
const ENTITY_NAME = /\b(l\.?\s?p\.?|llc|l\.l\.c\.|llp|ltd\.?|inc\.?|corp\.?|gmbh|s\.?a\.?r\.?l|scsp|management|holdings?|fund|funds|capital|ventures|partners|associates|trust|company|advisors|advisers|group)\b/i;
// Filings are inconsistent about case: the same person appears as "ELON MUSK" on one and
// "Elon Musk" on the next, which splits them into two directory entries. Normalise only the
// shouted form — a name already in mixed case is left exactly as filed.
function normalizePersonName(full) {
    const s = String(full || '').trim().replace(/\s+/g, ' ');
    if (!s || s !== s.toUpperCase()) return s;
    return s.split(' ').map((w) => (w.length <= 1 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(' ');
}

const isPersonName = (full) =>
    !!full && !/^n\/?a\b/i.test(full) && full.replace(/[^a-z]/gi, '').length >= 4 && !ENTITY_NAME.test(full);

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

module.exports = { recentQuarters, fetchQuarter, readTsv, num, intOr, isoDate, edgarUrl, titleCase, isPersonName, normalizePersonName, ENTITY_NAME, chunk };
