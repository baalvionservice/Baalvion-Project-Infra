'use strict';
/**
 * International coverage from national company registers.
 *
 *   node scripts/ingest-registry.js --country=no,fi [--from=2020-01-01] [--dry]
 *
 * Why registers and not a US filing: Form D only sees companies raising under US Reg D, so
 * "founders in every corner" cannot come from it. Each country's register is its own source with
 * its own identifiers, so an adapter per country normalises into the shared companies table.
 *
 * SCOPE MATTERS MORE THAN VOLUME. A national register holds every entity in the country —
 * dormant shells, sole traders, housing co-ops, sports clubs. Ingesting all of it would inflate
 * the directory with rows no founder or investor would ever want, so each adapter filters to
 * limited companies, in sectors this directory is about, registered recently enough to be live.
 * The counts printed are what survived that filter, never the register's headline total.
 *
 * Not invented: these registers publish no funding, no investors and no founder narrative. Only
 * what the register states is stored; everything else stays null.
 */
const db = require('../models');
const { resolvePlace } = require('../data/gazetteer');
const { chunk, titleCase } = require('../lib/formd');

const UA = process.env.SEC_USER_AGENT || 'Baalvion Directory mumbai.neverendservices@gmail.com';
const arg = (k, d) => {
    const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
    return hit ? hit.split('=')[1] : d;
};
const DRY = process.argv.includes('--dry');
const FROM = arg('from', '2020-01-01');
const LIMIT = Number(arg('limit', 0)) || Infinity;

const getJson = async (url) => {
    const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// NACE divisions this directory is about: software, information services, R&D, professional and
// scientific work, pharma, electronics, publishing/media, business support.
const NACE_DIVISIONS = ['62', '63', '72', '71', '21', '26', '58', '82', '32', '73'];

// ── Norway — Enhetsregisteret (Brønnøysundregistrene), fully open, no key ──────────────────
async function norway(onRow) {
    let seen = 0;
    for (const nace of NACE_DIVISIONS) {
        let page = 0;
        for (;;) {
            const url = `https://data.brreg.no/enhetsregisteret/api/enheter?size=500&page=${page}`
                + `&organisasjonsform=AS&naeringskode=${nace}&fraRegistreringsdatoEnhetsregisteret=${FROM}`;
            let d;
            try { d = await getJson(url); } catch (e) { console.log(`[no] ${nace} page ${page}: ${e.message}`); break; }
            const rows = d?._embedded?.enheter || [];
            if (!rows.length) break;
            for (const e of rows) {
                if (e.slettedato) continue;   // deregistered
                const addr = e.forretningsadresse || e.postadresse || {};
                const city = titleCase(addr.poststed || '', addr.poststed || '');
                onRow({
                    source: 'brreg',
                    registry_name: 'Enhetsregisteret (Brønnøysundregistrene)',
                    source_id: `NO-${e.organisasjonsnummer}`,
                    registry_number: e.organisasjonsnummer,
                    source_url: `https://virksomhet.brreg.no/nb/oppslag/enheter/${e.organisasjonsnummer}`,
                    name: e.navn,
                    legal_form: e.organisasjonsform?.beskrivelse || null,
                    industry_code: e.naeringskode1?.kode || null,
                    industry_group: e.naeringskode1?.beskrivelse || null,
                    founded_on: e.stiftelsesdato || e.registreringsdatoEnhetsregisteret || null,
                    employees: Number.isFinite(e.antallAnsatte) ? e.antallAnsatte : null,
                    website: e.hjemmeside ? (e.hjemmeside.startsWith('http') ? e.hjemmeside : `https://${e.hjemmeside}`) : null,
                    status: e.konkurs ? 'Bankrupt' : (e.underAvvikling ? 'In liquidation' : 'Active'),
                    location: [city, 'Norway'].filter(Boolean).join(', '),
                });
                seen++;
                if (seen >= LIMIT) return;
            }
            if (page >= (d.page?.totalPages ?? 1) - 1) break;
            page++;
            await sleep(120);   // be a good citizen on a free public API
        }
        console.log(`[no] NACE ${nace}: ${seen} so far`);
    }
}

// ── Finland — PRH avoindata (YTJ), fully open, no key ──────────────────────────────────────
const FI_NAME = (c) => {
    const names = (c.names || []).filter((n) => !n.endDate);
    return (names.find((n) => n.type === '1') || names[0] || {}).name || null;
};
const FI_DESC = (arr, fallback = null) => {
    const list = arr || [];
    // languageCode 3 is English where present, 1 Finnish, 2 Swedish.
    return (list.find((d) => d.languageCode === '3') || list.find((d) => d.languageCode === '1') || list[0] || {}).description || fallback;
};

async function finland(onRow) {
    let seen = 0;
    // mainBusinessLine accepts a division prefix, so one query per division — walking all 100
    // sub-codes meant a thousand mostly-empty round trips.
    for (const nace of NACE_DIVISIONS) {
        {
            let page = 1;
            for (;;) {
                if (seen >= LIMIT) return;
                const url = `https://avoindata.prh.fi/opendata-ytj-api/v3/companies?maxResults=100&page=${page}`
                    + `&mainBusinessLine=${nace}&registrationDateStart=${FROM}&totalResults=false`;
                let d;
                try { d = await getJson(url); } catch { break; }
                const rows = d?.companies || [];
                if (!rows.length) break;
                for (const c of rows) {
                    const name = FI_NAME(c);
                    if (!name) continue;
                    // PRH accepts mainBusinessLine and registrationDateStart but does not honour
                    // them — a NACE-62 query returns hairdressers, and a 2023 cutoff returns 1998
                    // registrations. Re-apply both here so nothing lands that was not asked for.
                    const code = String(c.mainBusinessLine?.type || '');
                    if (!NACE_DIVISIONS.includes(code.slice(0, 2))) continue;
                    const regDate = c.businessId?.registrationDate || '';
                    if (regDate && regDate < FROM) continue;
                    const addr = (c.addresses || []).find((a) => !a.endDate) || (c.addresses || [])[0] || {};
                    const city = titleCase(addr.postOffices?.[0]?.city || '', addr.postOffices?.[0]?.city || '');
                    // PRH's `status` is a registration state, not a liveness flag — '2' means
                    // registered, and reading it as "ceased" silently dropped every single row.
                    // An actual end date is the only reliable signal that a company has stopped.
                    const status = c.endDate ? 'Ceased' : 'Active';
                    if (status === 'Ceased') continue;
                    onRow({
                        source: 'prh',
                        registry_name: 'Finnish Business Information System (PRH/YTJ)',
                        source_id: `FI-${c.businessId?.value}`,
                        registry_number: c.businessId?.value || null,
                        source_url: c.businessId?.value ? `https://tietopalvelu.ytj.fi/yritys/${c.businessId.value}` : null,
                        name: titleCase(name, name),
                        legal_form: FI_DESC((c.companyForms || []).find((f) => !f.endDate)?.descriptions),
                        industry_code: c.mainBusinessLine?.type || null,
                        industry_group: FI_DESC(c.mainBusinessLine?.descriptions),
                        founded_on: c.businessId?.registrationDate || null,
                        employees: null,
                        website: (c.website || {}).url || null,
                        status,
                        location: [city, 'Finland'].filter(Boolean).join(', '),
                    });
                    seen++;
                    if (seen >= LIMIT) return;
                }
                if (rows.length < 100) break;
                page++;
                await sleep(120);
            }
        }
        console.log(`[fi] NACE ${nace}: ${seen} so far`);
    }
}


// ── United Kingdom — Companies House, needs a free API key ────────────────────────────────
// Register at developer.company-information.service.gov.uk, then set COMPANIES_HOUSE_KEY.
// Auth is HTTP Basic with the key as the username and an empty password.
//
// UK SIC codes are 5 digits and do not map onto NACE divisions one-for-one, so the sector scope is
// stated explicitly rather than derived — using NACE prefixes here would silently pull in the
// wrong industries.
const UK_SIC = [
    '62012', '62020', '62090', '62011',          // software, IT consultancy
    '63110', '63120', '63990',                    // data processing, web portals, information services
    '72110', '72190',                             // R&D: biotech, natural sciences
    '58210', '58290',                             // publishing: games, other software
    '71129', '74909',                             // engineering, other professional
    '26200', '26110',                             // computers, electronic components
    '86900', '21100', '21200',                    // health, pharma
];

async function unitedKingdom(onRow) {
    const key = process.env.COMPANIES_HOUSE_KEY;
    if (!key) {
        console.log('[uk] COMPANIES_HOUSE_KEY is not set — skipped.');
        console.log('     Get a free key at https://developer.company-information.service.gov.uk/ and re-run.');
        return;
    }
    const auth = 'Basic ' + Buffer.from(`${key}:`).toString('base64');
    const get = async (url) => {
        const r = await fetch(url, { headers: { Accept: 'application/json', Authorization: auth, 'User-Agent': UA } });
        if (r.status === 429) { await sleep(2000); return get(url); }   // documented rate limit
        if (!r.ok) throw new Error(`${r.status} ${url}`);
        return r.json();
    };

    let seen = 0;
    for (const sic of UK_SIC) {
        let start = 0;
        for (;;) {
            if (seen >= LIMIT) return;
            const url = 'https://api.company-information.service.gov.uk/advanced-search/companies'
                + `?sic_codes=${sic}&incorporated_from=${FROM}&company_status=active&size=100&start_index=${start}`;
            let d;
            try { d = await get(url); } catch (e) { console.log(`[uk] ${sic} @${start}: ${e.message}`); break; }
            const items = d?.items || [];
            if (!items.length) break;
            for (const c of items) {
                const a = c.registered_office_address || {};
                const city = titleCase(a.locality || a.region || '', a.locality || a.region || '');
                onRow({
                    source: 'companies_house',
                    registry_name: 'Companies House (United Kingdom)',
                    source_id: `GB-${c.company_number}`,
                    registry_number: c.company_number,
                    source_url: `https://find-and-update.company-information.service.gov.uk/company/${c.company_number}`,
                    name: titleCase(c.company_name, c.company_name),
                    legal_form: c.company_type || null,
                    industry_code: (c.sic_codes || [])[0] || sic,
                    industry_group: null,          // Companies House returns the code, not a label
                    founded_on: c.date_of_creation || null,
                    employees: null,
                    website: null,
                    status: c.company_status === 'active' ? 'Active' : titleCase(String(c.company_status || ''), ''),
                    street: [a.address_line_1, a.address_line_2].filter(Boolean).join(', ') || null,
                    postal_code: a.postal_code || null,
                    location: [city, 'United Kingdom'].filter(Boolean).join(', '),
                });
                seen++;
                if (seen >= LIMIT) return;
            }
            start += items.length;
            if (start >= (d.hits ?? 0)) break;
            await sleep(600);   // Companies House allows 600 requests / 5 minutes
        }
        console.log(`[uk] SIC ${sic}: ${seen} so far`);
    }
}

const SOURCE_BY_COUNTRY = { no: 'brreg', fi: 'prh', uk: 'companies_house' };

const ADAPTERS = { no: norway, fi: finland, uk: unitedKingdom };

(async () => {
    const countries = String(arg('country', 'no,fi')).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const rows = [];
    const seenIds = new Set();

    for (const c of countries) {
        const fn = ADAPTERS[c];
        if (!fn) { console.log(`[registry] no adapter for "${c}" — skipped`); continue; }
        const before = rows.length;
        await fn((row) => {
            if (!row.name || !row.source_id || seenIds.has(row.source_id)) return;
            seenIds.add(row.source_id);
            rows.push(row);
        });
        console.log(`[registry] ${c}: ${rows.length - before} companies`);
    }

    console.log(`\n[registry] ${rows.length} companies total`);
    if (DRY) {
        for (const r of rows.slice(0, 12)) {
            console.log(`   ${String(r.name).slice(0, 40).padEnd(40)} ${String(r.industry_group || '-').slice(0, 34).padEnd(34)} ${r.location}  ${r.founded_on || ''}`);
        }
        process.exit(0);
    }

    const now = new Date();
    const shaped = rows.map((r) => ({
        ...r,
        ...resolvePlace(r.location),
        year_founded: r.founded_on ? Number(String(r.founded_on).slice(0, 4)) : null,
        last_verified_at: now,
        filing_count: 0,
    }));

    const existing = new Map(
        (await db.Company.findAll({ where: { source: countries.map((c) => SOURCE_BY_COUNTRY[c]).filter(Boolean) }, attributes: ['id', 'source_id'] }))
            .map((r) => [r.source_id, r.id]),
    );
    const toCreate = shaped.filter((x) => !existing.has(x.source_id));
    const toUpdate = shaped.filter((x) => existing.has(x.source_id));

    for (const part of chunk(toCreate, 500)) await db.Company.bulkCreate(part, { hooks: false });
    for (const part of chunk(toUpdate, 100)) {
        await Promise.all(part.map((x) => db.Company.update(x, { where: { id: existing.get(x.source_id) }, hooks: false })));
    }
    console.log(`[registry] +${toCreate.length} new, ${toUpdate.length} updated`);
    process.exit(0);
})().catch((e) => { console.error('[registry] failed:', e); process.exit(1); });
