'use strict';
/**
 * Builds the investor directory from SEC Form D — the notice every US private fund must file
 * when it raises capital under Reg D. Primary source, public domain, no scraping: the SEC
 * publishes it as quarterly structured datasets.
 *
 *   node scripts/ingest-sec-formd.js [--quarters=8] [--types=vc,pe,other] [--dry]
 *
 * What each Form D filing is: ONE fund vehicle ("Spark Capital IX, L.P."), not the firm. A firm
 * raises a new vehicle every few years, so the directory groups vehicles into a firm and keeps
 * every filing underneath it in investor_funds — the firm page then shows what was merged and
 * links each claim back to its accession number on EDGAR.
 *
 * What is NOT invented here: thesis, focus sectors, stages and cheque size are left null,
 * because Form D does not report them. A sparse profile is the honest output; the UI says
 * "not disclosed" rather than guessing.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const db = require('../models');
const { resolvePlace } = require('../data/gazetteer');
const { normalizePersonName } = require('../lib/formd');

const UA = process.env.SEC_USER_AGENT || 'Baalvion Directory mumbai.neverendservices@gmail.com';
const BASE = 'https://www.sec.gov/files';
// The SEC moved the folder mid-2026; try both, newest path first.
const PATHS = ['datastandardsinnovation/data/form-d-data-sets', 'structureddata/data/form-d-data-sets'];

const arg = (k, d) => {
    const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
    return hit ? hit.split('=')[1] : d;
};
const DRY = process.argv.includes('--dry');
const QUARTERS = Number(arg('quarters', 8));
// Default to funds that actually invest in companies. "Other Investment Fund" is mostly
// liquidity vehicles, insurance separate accounts and portfolio sleeves — a founder cannot raise
// from those, and padding the directory with them would make its size a lie about its usefulness.
const TYPE_FILTER = String(arg('types', 'vc,pe')).split(',').map((s) => s.trim().toLowerCase());

const FUND_TYPE_LABEL = {
    'Venture Capital Fund': { key: 'vc', firm_type: 'Venture Capital' },
    'Private Equity Fund': { key: 'pe', firm_type: 'Private Equity' },
    'Hedge Fund': { key: 'hedge', firm_type: 'Hedge Fund' },
    'Other Investment Fund': { key: 'other', firm_type: 'Investment Fund' },
};

// ── quarters to fetch, newest first ───────────────────────────────────────────────────────
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

const CACHE = path.join(os.tmpdir(), 'baalvion-formd');
fs.mkdirSync(CACHE, { recursive: true });

// The four TSVs the parser actually reads. A quarter is only usable if all four survived —
// tmpdir reapers prune the extracted files but leave the .ok marker, and trusting the marker
// alone made a pruned quarter parse as zero filings while still reporting success.
const REQUIRED_TSV = ['FORMDSUBMISSION.tsv', 'ISSUERS.tsv', 'RELATEDPERSONS.tsv', 'OFFERING.tsv'];
const quarterIsComplete = (dir) =>
    fs.existsSync(path.join(dir, '.ok')) && REQUIRED_TSV.every((f) => fs.existsSync(path.join(dir, f)));

function fetchQuarter(qtr) {
    const dir = path.join(CACHE, qtr);
    if (quarterIsComplete(dir)) return dir;
    // Stale or half-extracted cache — drop it and re-download rather than parse a gap.
    fs.rmSync(dir, { recursive: true, force: true });
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

// ── TSV reader. Values are unquoted in these files, so a plain split is correct and ~20x faster
//    than a full CSV parser over 8 quarters. ────────────────────────────────────────────────
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

// ── firm name derivation ───────────────────────────────────────────────────────────────────
// Filings shout their names ("TRUMBULL PROPERTY"); the directory should not.
function titleCase(s, original) {
    // Acronyms are unbounded (LSV, ECP, ISQ, KKR…), so instead of listing them, keep any short
    // all-caps token that was all-caps in the source — unless the whole source was shouting.
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
const LEGAL = /,?\s*\b(l\.?\s?p\.?|llc|l\.l\.c\.|ltd\.?|limited|inc\.?|corp\.?|corporation|gp|llp|plc|sa|nv|bv|ag|gmbh|pte\.?|co\.?|scsp|sca|sarl|s\.?a\.?r\.?l\.?|icav|fcp|sicav|spc|kg|slp|scs|sca|sas|oy|ab|as)\b\.?\s*$/i;
const ROMAN = /\s+\b(?:[IVXLC]{1,7}|\d{1,3})\b\.?\s*$/;
// Structure and share-class markers a firm hangs off one fund family: KKR files the same fund as
// SBS, ESC (Lev), (EUR) and (USD) vehicles, which are one product, not four firms.
const TRAILER = /\s+\b(fund|funds|feeder|onshore|offshore|master|parallel|annex|overage|co-?invest(ment)?s?|spv|vehicle|holdings?|partners(hip)?|investors|sbs|esc|aiv|blocker|trust|te|qp|erisa|lev|unlev|unlevered|levered|usd|eur|gbp|cayman|delaware|luxembourg|access|series|class|[a-z])\b\.?\s*$/i;
const PAREN_TAIL = /\s*\([^)]*\)\s*$/;
// Marks a "person" row that is really an entity.
const ENTITY_NAME = /\b(l\.?\s?p\.?|llc|l\.l\.c\.|llp|ltd\.?|inc\.?|corp\.?|gmbh|s\.?a\.?r\.?l|scsp|management|holdings?|fund|funds|capital|ventures|partners|associates|trust|company|advisors|advisers|group)\b/i;
// Share-class tails like "Partners IX - C" or "Fund X – B2".
const CLASS_TAIL = /\s*[-–]\s*[A-Z]{1,3}\d?\s*$/;

// Over-stripping is worse than under-stripping: a firm called "Strategic" or "Growth" is not a
// firm, it is the remains of one. Stop before the name becomes a bare generic word.
const GENERIC = new Set(['strategic', 'growth', 'opportunity', 'opportunities', 'core', 'select', 'global',
    'capital', 'partners', 'ventures', 'venture', 'income', 'credit', 'equity', 'real', 'property',
    'value', 'special', 'situations', 'private', 'direct', 'secondary', 'secondaries', 'alpha', 'beta']);
const tooGeneric = (s) => !s || s.length < 3 || (!s.includes(' ') && GENERIC.has(s.toLowerCase()));

// Rules are applied ONE at a time, not chained: chaining them meant a final over-strip
// ("Strategic Partners" -> "Strategic") threw away the legitimate strips earlier in the same
// pass, and "STRATEGIC PARTNERS X L.P." came out completely unshortened.
const RULES = [PAREN_TAIL, CLASS_TAIL, LEGAL, ROMAN, TRAILER, /[,\-–\s]+$/];

// Series-LLC vehicles name their sponsor explicitly: "Su-1217 Fund I, A Series Of Thicket
// Ventures" is one deal SPV, and Thicket Ventures is the firm. Over half the raw filings are these,
// so treating each as its own firm produced 24,032 phantom "investors" and made Seattle look like
// it held 13,688 venture firms — it holds one fund administrator's suite address.
// Greedy prefix so the LAST occurrence wins: "X, A Series Of V360 Holdings LLC A Series Of V360"
// captured the whole tail with a non-greedy match and left the marker in the firm name.
const SERIES_OF = /^.*\ba series of\s+(.+)$/i;

function firmName(entityName) {
    const original = String(entityName || '').trim().replace(/\s+/g, ' ');
    const sponsor = original.match(SERIES_OF);
    let s = sponsor ? sponsor[1].trim() : original;
    for (let pass = 0; pass < 12; pass++) {
        let changed = false;
        for (const rule of RULES) {
            const next = s.replace(rule, '').trim();
            if (next === s) continue;
            if (tooGeneric(next)) continue;   // this rule would go too far; try the others
            s = next;
            changed = true;
        }
        if (!changed) break;
    }
    return titleCase(s || original, sponsor ? sponsor[1] : original);
}
const normKey = (s) => firmName(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const num = (v) => { const n = Number(String(v || '').replace(/[^0-9.-]/g, '')); return Number.isFinite(n) && String(v || '').trim() !== '' ? n : null; };
const intOr = (v) => { const n = parseInt(String(v || ''), 10); return Number.isFinite(n) ? n : null; };
// Form D writes dates as 15-JUN-2026 in submissions and 2026-04-03 in offerings.
const MONTHS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };
function isoDate(v) {
    const s = String(v || '').trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/i);
    if (m) return `${m[3]}-${MONTHS[m[2].toUpperCase()] || '01'}-${m[1].padStart(2, '0')}`;
    return null;
}
const edgarUrl = (cik, accession) => {
    const a = String(accession || '').replace(/-/g, '');
    const c = String(cik || '').replace(/^0+/, '');
    return c && a ? `https://www.sec.gov/Archives/edgar/data/${c}/${a}/${accession}-index.htm` : null;
};

// ── main ───────────────────────────────────────────────────────────────────────────────────

// Administrator and registered-agent addresses are not locations. The upsert above writes city
// straight from the filing, so this must run after every ingest or the false geography returns.
async function flagServiceAddresses() {
    const schema = db.sequelize.options.define?.schema || 'insiders';
    for (const t of ['investors', 'companies']) {
        await db.sequelize.query(`
            WITH hubs AS (
              SELECT lower(regexp_replace(street, '[^a-z0-9]+', '', 'gi')) k, city
                FROM "${schema}"."${t}" WHERE street IS NOT NULL AND city IS NOT NULL
               GROUP BY 1,2 HAVING COUNT(*) >= 100
            )
            UPDATE "${schema}"."${t}" x
               SET address_is_service = TRUE, city = NULL, city_slug = NULL, state = NULL, state_slug = NULL
              FROM hubs h
             WHERE lower(regexp_replace(x.street, '[^a-z0-9]+', '', 'gi')) = h.k AND x.city = h.city`);
    }
}

(async () => {
    const firms = new Map();   // normKey -> firm accumulator
    let filings = 0, skipped = 0;

    // The current quarter is not published until it closes, so ask for a few extra candidates and
    // stop once QUARTERS of them actually resolved — otherwise --quarters=1 silently fetches nothing.
    let loaded = 0;
    for (const qtr of recentQuarters(QUARTERS + 2)) {
        if (loaded >= QUARTERS) break;
        const dir = fetchQuarter(qtr);
        if (!dir) { console.log(`[formd] ${qtr}: not published yet, skipped`); continue; }
        loaded++;

        const subs = new Map(readTsv(path.join(dir, 'FORMDSUBMISSION.tsv')).map((r) => [r.ACCESSIONNUMBER, r]));
        const issuers = new Map();
        for (const r of readTsv(path.join(dir, 'ISSUERS.tsv'))) {
            if (r.IS_PRIMARYISSUER_FLAG === 'YES') issuers.set(r.ACCESSIONNUMBER, r);
        }
        const people = new Map();
        for (const r of readTsv(path.join(dir, 'RELATEDPERSONS.tsv'))) {
            if (!people.has(r.ACCESSIONNUMBER)) people.set(r.ACCESSIONNUMBER, []);
            people.get(r.ACCESSIONNUMBER).push(r);
        }

        let qCount = 0;
        for (const off of readTsv(path.join(dir, 'OFFERING.tsv'))) {
            const meta = FUND_TYPE_LABEL[off.INVESTMENTFUNDTYPE];
            if (!meta || !TYPE_FILTER.includes(meta.key)) { skipped++; continue; }
            const acc = off.ACCESSIONNUMBER;
            const iss = issuers.get(acc);
            if (!iss || !iss.ENTITYNAME) { skipped++; continue; }

            const key = normKey(iss.ENTITYNAME);
            if (!key) { skipped++; continue; }

            const filingDate = isoDate(subs.get(acc)?.FILING_DATE);
            const city = titleCase(iss.CITY, iss.CITY);
            const region = titleCase(iss.STATEORCOUNTRYDESCRIPTION, iss.STATEORCOUNTRYDESCRIPTION);

            if (!firms.has(key)) {
                firms.set(key, {
                    key,
                    name: firmName(iss.ENTITYNAME),
                    cik: iss.CIK,
                    city, region,
                    entity_type: iss.ENTITYTYPE || null,
                    year_founded: intOr(iss.YEAROFINC_VALUE_ENTERED),
                    // Every Form D filer must give a business address and telephone number for
                    // regulatory contact, and EDGAR publishes both. This is the firm's own filed
                    // contact — the only route a founder has to reach it, since Form D carries no
                    // email or website at all.
                    street: [iss.STREET1, iss.STREET2].map((x) => String(x || '').trim()).filter(Boolean).join(', ') || null,
                    postal_code: iss.ZIPCODE || null,
                    phone: iss.ISSUERPHONENUMBER || null,
                    firm_type: meta.firm_type,
                    typeCounts: {},
                    funds: [],
                    people: new Map(),
                    total: 0,
                    first: filingDate, last: filingDate,
                });
            }
            const f = firms.get(key);
            f.typeCounts[meta.firm_type] = (f.typeCounts[meta.firm_type] || 0) + 1;
            if (filingDate) {
                if (!f.first || filingDate < f.first) f.first = filingDate;
                if (!f.last || filingDate > f.last) {
                    f.last = filingDate;
                    f.city = city || f.city;
                    f.region = region || f.region;
                    f.cik = iss.CIK;
                    const street = [iss.STREET1, iss.STREET2].map((x) => String(x || '').trim()).filter(Boolean).join(', ');
                    if (street) f.street = street;
                    if (iss.ZIPCODE) f.postal_code = iss.ZIPCODE;
                    if (iss.ISSUERPHONENUMBER) f.phone = iss.ISSUERPHONENUMBER;
                }
            }
            if (!f.year_founded) f.year_founded = intOr(iss.YEAROFINC_VALUE_ENTERED);

            const sold = num(off.TOTALAMOUNTSOLD);
            if (sold) f.total += sold;

            f.funds.push({
                fund_name: iss.ENTITYNAME.trim(),
                cik: iss.CIK,
                accession_number: acc,
                fund_type: off.INVESTMENTFUNDTYPE || null,
                industry_group: off.INDUSTRYGROUPTYPE || null,
                entity_type: iss.ENTITYTYPE || null,
                jurisdiction: iss.JURISDICTIONOFINC || null,
                year_of_inc: intOr(iss.YEAROFINC_VALUE_ENTERED),
                total_offering_usd: num(off.TOTALOFFERINGAMOUNT),
                total_sold_usd: sold,
                remaining_usd: num(off.TOTALREMAINING),
                min_investment_usd: num(off.MINIMUMINVESTMENTACCEPTED),
                investor_count: intOr(off.TOTALNUMBERALREADYINVESTED),
                first_sale_date: isoDate(off.SALE_DATE),
                filing_date: filingDate,
                is_amendment: String(off.ISAMENDMENT).toLowerCase() === 'true',
                city, state_or_country: region,
                source_url: edgarUrl(iss.CIK, acc),
            });

            for (const p of people.get(acc) || []) {
                const full = normalizePersonName([p.FIRSTNAME, p.MIDDLENAME, p.LASTNAME].map((x) => String(x || '').trim()).filter(Boolean).join(' '));
                // The "related person" slot is often filled with the GP entity rather than a
                // human ("- Sequoia Capital Fund Management, L.P."), or a literal "N/A". A name
                // carrying a legal suffix or a fund-structure word is an entity, not a person,
                // and listing it as one would misattribute a firm's leadership.
                if (!full || /^n\/?a\b/i.test(full) || full.replace(/[^a-z]/gi, '').length < 4) continue;
                if (ENTITY_NAME.test(full)) continue;
                const rels = [p.RELATIONSHIP_1, p.RELATIONSHIP_2, p.RELATIONSHIP_3].filter(Boolean);
                const prev = f.people.get(full);
                if (prev) {
                    prev.filings_count++;
                    prev.relationships = [...new Set([...prev.relationships, ...rels])];
                    if (filingDate && (!prev.last_seen || filingDate > prev.last_seen)) prev.last_seen = filingDate;
                    if (filingDate && (!prev.first_seen || filingDate < prev.first_seen)) prev.first_seen = filingDate;
                } else {
                    f.people.set(full, {
                        full_name: full, relationships: rels,
                        city: titleCase(p.CITY, p.CITY), state_or_country: titleCase(p.STATEORCOUNTRYDESCRIPTION, p.STATEORCOUNTRYDESCRIPTION),
                        filings_count: 1, first_seen: filingDate, last_seen: filingDate,
                        source_url: edgarUrl(iss.CIK, acc),
                    });
                }
            }
            filings++; qCount++;
        }
        console.log(`[formd] ${qtr}: ${qCount} fund filings`);
    }

    // Merge "Spark Capital Growth" into "Spark Capital" when one name is a strict prefix of the
    // other AND they share a city — same firm, different product line. Different cities are left
    // alone, because a shared prefix across cities is usually two unrelated firms.
    const keys = [...firms.keys()].sort((a, b) => a.length - b.length);
    for (const longKey of [...keys].reverse()) {
        const long = firms.get(longKey);
        if (!long) continue;
        for (const shortKey of keys) {
            if (shortKey === longKey || !firms.has(shortKey)) continue;
            if (!longKey.startsWith(shortKey + ' ')) continue;
            const short = firms.get(shortKey);
            if (!short || short.city !== long.city) continue;
            short.funds.push(...long.funds);
            short.total += long.total;
            for (const [n, p] of long.people) {
                const prev = short.people.get(n);
                if (prev) prev.filings_count += p.filings_count; else short.people.set(n, p);
            }
            if (long.first && (!short.first || long.first < short.first)) short.first = long.first;
            if (long.last && (!short.last || long.last > short.last)) short.last = long.last;
            for (const [t, c] of Object.entries(long.typeCounts)) short.typeCounts[t] = (short.typeCounts[t] || 0) + c;
            firms.delete(longKey);
            break;
        }
    }

    console.log(`\n[formd] ${filings} fund filings -> ${firms.size} firms (${skipped} rows skipped: not a fund of a requested type)`);
    if (DRY) {
        const top = [...firms.values()].sort((a, b) => b.total - a.total).slice(0, 15);
        for (const f of top) console.log(`   ${f.name.slice(0, 46).padEnd(46)} ${String(f.funds.length).padStart(3)} filings  $${Math.round(f.total).toLocaleString().padStart(15)}  ${f.city}, ${f.region}`);
        process.exit(0);
    }

    // ── upsert ─────────────────────────────────────────────────────────────────────────────
    // Bulk throughout: a per-row findOrCreate over ~20k firms, ~45k filings and ~100k people is
    // hundreds of thousands of round trips. ignoreDuplicates leans on the unique indexes from
    // migration 010 (accession_number; investor_id+full_name) to make re-runs idempotent.
    const now = new Date();
    const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

    const shaped = [...firms.values()].map((f) => {
        const loc = [f.city, f.region].filter(Boolean).join(', ') || null;
        return {
            f,
            values: {
                name: f.name,
                firm: f.name,
                // The firm's type is whichever fund type it files most often.
                firm_type: Object.entries(f.typeCounts).sort((a, b) => b[1] - a[1])[0][0],
                location: loc,
                headquarters: loc,
                entity_type: f.entity_type,
                year_founded: f.year_founded,
                street: f.street || null,
                postal_code: f.postal_code || null,
                phone: f.phone || null,
                fund_count: f.funds.length,
                total_raised_usd: Math.round(f.total) || null,
                first_filing_date: f.first,
                last_filing_date: f.last,
                deals_backed: 0,
                is_verified: false,      // "filed with the SEC" is not the same as vetted by us
                source: 'sec_form_d',
                // The firm's stable id is its normalised name, NOT a CIK: every fund vehicle
                // registers its own CIK ("Spark Capital IX" and "Spark Capital Growth Fund VI"
                // have different ones), so a CIK identifies a fund, never the firm behind it.
                // Each vehicle's CIK is kept on its investor_funds row.
                source_id: f.key,
                source_url: edgarUrl(f.cik, f.funds[f.funds.length - 1]?.accession_number),
                last_verified_at: now,
                ...resolvePlace(loc),
            },
        };
    });

    const existing = new Map(
        (await db.Investor.findAll({ where: { source: 'sec_form_d' }, attributes: ['id', 'source_id'] }))
            .map((r) => [r.source_id, r.id]),
    );
    const toCreate = shaped.filter((x) => !existing.has(x.values.source_id));
    const toUpdate = shaped.filter((x) => existing.has(x.values.source_id));

    for (const part of chunk(toCreate, 500)) {
        const made = await db.Investor.bulkCreate(part.map((x) => x.values), { hooks: false, returning: true });
        made.forEach((row, i) => { part[i].id = row.id; existing.set(part[i].values.source_id, row.id); });
    }
    for (const part of chunk(toUpdate, 100)) {
        await Promise.all(part.map((x) => {
            x.id = existing.get(x.values.source_id);
            return db.Investor.update(x.values, { where: { id: x.id }, hooks: false });
        }));
    }

    const fundRows = shaped.flatMap((x) => x.f.funds.map((fund) => ({ ...fund, investor_id: x.id })));
    const peopleRows = shaped.flatMap((x) => [...x.f.people.values()].map((p) => ({ ...p, investor_id: x.id })));
    let fundsIn = 0, peopleIn = 0;
    for (const part of chunk(fundRows, 1000)) {
        fundsIn += (await db.InvestorFund.bulkCreate(part, { ignoreDuplicates: true, hooks: false })).length;
    }
    for (const part of chunk(peopleRows, 1000)) {
        peopleIn += (await db.InvestorPerson.bulkCreate(part, { ignoreDuplicates: true, hooks: false })).length;
    }

    console.log(`[formd] firms: +${toCreate.length} new, ${toUpdate.length} updated | filings ${fundsIn}/${fundRows.length} | people ${peopleIn}/${peopleRows.length}`);
    await flagServiceAddresses();
    process.exit(0);
})().catch((e) => { console.error('[formd] failed:', e); process.exit(1); });
