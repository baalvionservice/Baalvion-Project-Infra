'use strict';
/**
 * Public, UNAUTHENTICATED, SEO-safe reads powering the open investor directory.
 *
 * The line is "who they are and what they fund" vs "how to reach them":
 *   public  — identity, thesis, sectors, stages, region, firm type, location, check size, AUM,
 *             portfolio, deals backed, recent investments and news. A founder needs all of it to
 *             judge fit before spending a signup.
 *   public  — the business address and telephone AS FILED with the SEC. These are not private
 *             contact details we obtained: the filer supplies them for regulatory contact and
 *             EDGAR publishes them. Withholding them would mean the directory can say who funds
 *             companies like yours while offering no way to reach anyone.
 *   gated   — email, website, linkedin_url and the socials list, which are hand-entered or
 *             enriched rather than filed, and belong to profiles someone has claimed.
 * Pitch decks, data rooms and founder raise/valuation figures stay out entirely.
 */
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const withSlug = (base, id) => `${slugify(base) || 'profile'}-${String(id).slice(0, 8)}`;

// ── Founders (curated) ──────────────────────────────────────────────────────────
const FOUNDER_COLS = ['id', 'username', 'full_name', 'avatar_url', 'bio', 'company_name', 'company_about',
    'headline', 'sector', 'stage', 'region', 'location', 'country', 'country_slug', 'state', 'state_slug',
    'city', 'city_slug', 'updated_at'];
const publicFounder = (p) => {
    const o = {};
    for (const k of FOUNDER_COLS) o[k] = p[k] ?? null;
    o.slug = withSlug(p.company_name || p.full_name || p.username, p.id);
    return o;
};

async function listFounders(req, res, next) {
    try {
        const rows = await db.Profile.findAll({
            where: { role: 'founder', company_name: { [Op.ne]: null }, ...placeWhere(req.query) },
            attributes: FOUNDER_COLS,
            order: [['updated_at', 'DESC']],
            limit: 2000,
        });
        return sendSuccess(req, res, { founders: rows.map(publicFounder) });
    } catch (e) { return next(e); }
}

// ── Companies ─────────────────────────────────────────────────────────────────────────────
// Operating companies compiled from Form D, and the people named on their filings. Paged and
// faceted in SQL for the same reason the investor list is: there are tens of thousands.
const COMPANY_COLS = ['id', 'name', 'cik', 'source', 'source_url', 'entity_type', 'jurisdiction',
    'year_founded', 'industry_group', 'revenue_range', 'location', 'country', 'country_slug',
    'state', 'state_slug', 'city', 'city_slug', 'filing_count', 'total_raised_usd',
    'largest_round_usd', 'first_filing_date', 'last_filing_date', 'last_verified_at', 'updated_at',
    // national registers (migration 013) — a registry record carries these instead of filings
    'registry_name', 'registry_number', 'industry_code', 'legal_form', 'status', 'founded_on',
    'website', 'employees',
    // business contact as filed (migration 014)
    'street', 'postal_code', 'phone', 'claimed_at'];

const publicCompany = (c) => {
    const o = {};
    for (const k of COMPANY_COLS) o[k] = c[k] ?? null;
    o.slug = withSlug(c.name, c.id);
    return o;
};

const COMPANY_SORTS = {
    recent: [['last_filing_date', 'DESC NULLS LAST'], ['name', 'ASC']],
    raised: [['total_raised_usd', 'DESC NULLS LAST'], ['name', 'ASC']],
    name: [['name', 'ASC']],
};
const companyOrder = (sort) => (COMPANY_SORTS[sort] || COMPANY_SORTS.recent)
    .map(([col, dir]) => db.sequelize.literal(`"${col}" ${dir}`));

async function companyFacets(column, baseWhere) {
    const rows = await db.Company.findAll({
        attributes: [column, [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']],
        where: { ...VISIBLE, ...baseWhere, [column]: { [Op.ne]: null } },
        group: [column],
        order: [[db.sequelize.literal('n'), 'DESC']],
        limit: 60,
        raw: true,
    });
    return rows.map((r) => ({ value: r[column], n: Number(r.n) }));
}

async function listCompanies(req, res, next) {
    try {
        const q = req.query;
        const limit = Math.min(Math.max(parseInt(q.limit, 10) || 25, 1), 100);
        const page = Math.max(parseInt(q.page, 10) || 1, 1);

        const place = placeWhere(q);
        const term = String(q.q || '').trim();
        const text = term
            ? { [Op.or]: [{ name: { [Op.iLike]: `%${term}%` } }, { city: { [Op.iLike]: `%${term}%` } }] }
            : {};
        const industry = q.industry_slug
            ? { [Op.and]: [slugMatch('industry_group', q.industry_slug)] }
            : (q.industry ? { industry_group: String(q.industry) } : {});
        const where = { ...VISIBLE, ...place, ...text, ...industry };

        const { rows, count } = await db.Company.findAndCountAll({
            attributes: COMPANY_COLS,
            where,
            order: companyOrder(q.sort),
            limit,
            offset: (page - 1) * limit,
        });

        const [countries, states, cities, industries, counts] = await Promise.all([
            q.country ? [] : companyFacets('country', { ...text, ...industry }),
            q.state ? [] : companyFacets('state', { ...place, ...text, ...industry }),
            q.city ? [] : companyFacets('city', { ...place, ...text, ...industry }),
            companyFacets('industry_group', { ...place, ...text }),
            distinctCounts(db.Company, where, [['countries', 'country'], ['cities', 'city'], ['sectors', 'industry_group']]),
        ]);

        return sendSuccess(req, res, {
            companies: rows.map(publicCompany),
            total: count,
            page,
            pages: Math.ceil(count / limit) || 1,
            limit,
            counts,
            facets: { countries, states, cities, industries },
        });
    } catch (e) { return next(e); }
}

async function getCompany(req, res, next) {
    try {
        const c = await byIdOrSlug(db.Company, req.params.id, COMPANY_COLS);
        if (!c) throw new AppError('NOT_FOUND', 'Company not found', 404);
        const [filings, people] = await Promise.all([
            db.CompanyFiling.findAll({
                where: { company_id: c.id },
                order: [[db.sequelize.literal('"filing_date" DESC NULLS LAST')]],
                limit: 100,
            }),
            db.CompanyPerson.findAll({
                where: { company_id: c.id },
                attributes: ['id', 'full_name', 'relationships', 'city', 'state_or_country', 'filings_count', 'first_seen', 'last_seen'],
                order: [[db.sequelize.literal('"filings_count" DESC')], ['full_name', 'ASC']],
                limit: 100,
            }),
        ]);
        return sendSuccess(req, res, { company: { ...publicCompany(c), filings, people } });
    } catch (e) { return next(e); }
}

// ── People ────────────────────────────────────────────────────────────────────────────────
// 126k named individuals across both sides were unreachable: no page listed them and no search
// looked at them. Searching a partner's or founder's name is the most natural way in.
async function searchPeople(req, res, next) {
    try {
        const term = String(req.query.q || '').trim();
        if (term.length < 2) return sendSuccess(req, res, { people: [], total: 0 });
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
        const like = `%${term}%`;
        const schema = db.sequelize.options.define?.schema || 'insiders';

        // With QueryTypes.SELECT sequelize returns the rows directly, not [rows, metadata].
        const rows = await db.sequelize.query(`
            SELECT p.full_name, p.relationships, p.city, p.state_or_country, p.last_seen,
                   'investor' AS side, i.id AS entity_id, i.name AS entity_name
              FROM "${schema}"."investor_people" p
              JOIN "${schema}"."investors" i ON i.id = p.investor_id
             WHERE p.full_name ILIKE :like
             UNION ALL
            SELECT p.full_name, p.relationships, p.city, p.state_or_country, p.last_seen,
                   'company' AS side, c.id AS entity_id, c.name AS entity_name
              FROM "${schema}"."company_people" p
              JOIN "${schema}"."companies" c ON c.id = p.company_id
             WHERE p.full_name ILIKE :like
             ORDER BY last_seen DESC NULLS LAST
             LIMIT :limit
        `, { replacements: { like, limit }, type: db.sequelize.QueryTypes.SELECT });

        return sendSuccess(req, res, {
            people: (rows || []).map((r) => ({
                ...r,
                entity_slug: withSlug(r.entity_name, r.entity_id),
            })),
        });
    } catch (e) { return next(e); }
}

async function getFounder(req, res, next) {
    try {
        const p = await byIdOrSlug(db.Profile, req.params.id, FOUNDER_COLS);
        if (!p) throw new AppError('NOT_FOUND', 'Founder not found', 404);
        return sendSuccess(req, res, { founder: publicFounder(p) });
    } catch (e) { return next(e); }
}

// ── Investors (curated + recent investments) ──────────────────────────────────────
const INVESTOR_COLS = ['id', 'name', 'firm', 'title', 'avatar_url', 'thesis', 'focus_sectors', 'stages', 'region',
    'firm_type', 'location', 'headquarters', 'check_min', 'check_max', 'aum_usd', 'portfolio', 'deals_backed',
    'is_verified', 'updated_at', 'country', 'country_slug', 'state', 'state_slug', 'city', 'city_slug',
    'source', 'source_url', 'entity_type', 'year_founded', 'fund_count', 'total_raised_usd',
    'first_filing_date', 'last_filing_date', 'last_verified_at',
    // business contact as filed with the SEC (migration 014)
    'street', 'postal_code', 'phone', 'claimed_at'];
const publicInvestor = (i) => {
    const o = {};
    for (const k of INVESTOR_COLS) o[k] = i[k] ?? null;
    o.slug = withSlug(i.firm || i.name, i.id);
    return o;
};

// Place filters are equality on resolved slugs, never a LIKE over free text — see
// data/gazetteer.js for why.
// Suppressed records are invisible to every public read. Set once by an admin; the ingest
// never writes this column, so a hidden row stays hidden across re-runs.
const VISIBLE = { is_hidden: false };

const placeWhere = (q) => {
    const w = {};
    if (q.country) w.country_slug = String(q.country);
    if (q.city) {
        w.city_slug = String(q.city);
        if (q.state) w.state_slug = String(q.state);
        return w;
    }
    // Two-segment URLs (/in/<country>/<segment>) are ambiguous: countries with a state layer put
    // a state there, countries without one (Singapore, UAE, Germany) put a city. Match either,
    // rather than returning an empty page for half the world.
    if (q.state) {
        const seg = String(q.state);
        w[Op.or] = [{ state_slug: seg }, { state_slug: null, city_slug: seg }];
    }
    return w;
};

// Filtering, sorting, paging and facet counts all run in the database. With 20k+ firms the old
// "send everything and filter in the browser" shape would ship megabytes per page load and still
// show wrong counts once it truncated.
const SORTS = {
    recent: [['last_filing_date', 'DESC NULLS LAST'], ['name', 'ASC']],
    raised: [['total_raised_usd', 'DESC NULLS LAST'], ['name', 'ASC']],
    funds: [['fund_count', 'DESC NULLS LAST'], ['name', 'ASC']],
    name: [['name', 'ASC']],
};
const orderFor = (sort) => (SORTS[sort] || SORTS.recent).map(([col, dir]) =>
    db.sequelize.literal(`"${col}" ${dir}`));

const searchWhere = (q) => {
    const term = String(q || '').trim();
    if (!term) return {};
    const like = `%${term.replace(/[%_]/g, (c) => `\\${c}`)}%`;
    return { [Op.or]: [{ name: { [Op.iLike]: like } }, { firm: { [Op.iLike]: like } }, { city: { [Op.iLike]: like } }] };
};

// Facet URLs carry a slug; the column holds the display value. Matching on a slugified column
// avoids a slug->value lookup table that would drift as new values appear in the filings.
const slugMatch = (column, slug) => db.sequelize.where(
    db.sequelize.fn('regexp_replace', db.sequelize.fn('lower', db.sequelize.col(column)), '[^a-z0-9]+', '-', 'g'),
    String(slug),
);

const typeWhere = (t, slug) => (slug ? { [Op.and]: [slugMatch('firm_type', slug)] } : (t ? { firm_type: String(t) } : {}));

// Counts for one facet are computed with every OTHER filter applied, so each option shows what
// it would add rather than what is already selected.
async function facetCounts(column, baseWhere) {
    const rows = await db.Investor.findAll({
        attributes: [column, [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']],
        where: { ...VISIBLE, ...baseWhere, [column]: { [Op.ne]: null } },
        group: [column],
        order: [[db.sequelize.literal('n'), 'DESC']],
        limit: 60,
        raw: true,
    });
    return rows.map((r) => ({ value: r[column], n: Number(r.n) }));
}

// Facet lists are capped at 60, so deriving "how many countries" from their length reports the
// cap, not the truth — and on a place page, where a facet is suppressed entirely, it reported 0.
// These are real COUNT(DISTINCT) values under the same filter.
async function distinctCounts(model, where, columns) {
    const out = {};
    await Promise.all(columns.map(async ([key, col]) => {
        const [row] = await model.findAll({
            attributes: [[db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col(col))), 'n']],
            where,
            raw: true,
        });
        out[key] = Number(row?.n || 0);
    }));
    return out;
}

async function listInvestors(req, res, next) {
    try {
        const q = req.query;
        const limit = Math.min(Math.max(parseInt(q.limit, 10) || 25, 1), 100);
        const page = Math.max(parseInt(q.page, 10) || 1, 1);

        const place = placeWhere(q);
        const text = searchWhere(q.q);
        const type = typeWhere(q.type, q.type_slug);
        const where = { ...VISIBLE, ...place, ...text, ...type };

        const { rows, count } = await db.Investor.findAndCountAll({
            attributes: INVESTOR_COLS,
            where,
            order: orderFor(q.sort),
            limit,
            offset: (page - 1) * limit,
        });

        // Only offer a geographic facet the URL has not already fixed.
        const [countries, states, cities, types, counts] = await Promise.all([
            q.country ? [] : facetCounts('country', { ...text, ...type }),
            q.state ? [] : facetCounts('state', { ...place, ...text, ...type }),
            q.city ? [] : facetCounts('city', { ...place, ...text, ...type }),
            facetCounts('firm_type', { ...place, ...text }),
            distinctCounts(db.Investor, where, [['countries', 'country'], ['cities', 'city'], ['states', 'state']]),
        ]);

        return sendSuccess(req, res, {
            investors: rows.map(publicInvestor),
            total: count,
            page,
            pages: Math.ceil(count / limit) || 1,
            limit,
            counts,
            facets: { countries, states, cities, types },
        });
    } catch (e) { return next(e); }
}

// Accepts either a raw uuid or the readable slug the list emits ("ascend-angels-9d928143"),
// whose trailing segment is the first 8 characters of the id. Renaming a firm therefore changes
// the URL without stranding the old one.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const byIdOrSlug = async (model, param, attributes) => {
    const raw = String(param || '');
    const hidden = (row) => (row && row.get && row.get('is_hidden') === true ? null : row);
    if (UUID_RE.test(raw)) return hidden(await model.findByPk(raw, { attributes: [...attributes, 'is_hidden'] }));
    const prefix = (raw.match(/([0-9a-f]{8})$/i) || [])[1];
    if (!prefix) return null;
    const [row] = await model.findAll({
        attributes: [...attributes, 'is_hidden'],
        where: db.sequelize.where(db.sequelize.cast(db.sequelize.col('id'), 'text'), { [Op.like]: `${prefix.toLowerCase()}%` }),
        limit: 1,
    });
    return hidden(row) || null;
};

async function getInvestor(req, res, next) {
    try {
        const i = await byIdOrSlug(db.Investor, req.params.id, INVESTOR_COLS);
        if (!i) throw new AppError('NOT_FOUND', 'Investor not found', 404);
        const [investments, news, funds, people] = await Promise.all([
            db.Investment.findAll({
                where: { investor_id: i.id },
                attributes: ['id', 'target_company', 'round', 'amount_usd', 'invested_on', 'source_name', 'source_url'],
                order: [['invested_on', 'DESC']],
                limit: 25,
            }),
            db.InvestorNews.findAll({
                where: { investor_id: i.id },
                attributes: ['id', 'headline', 'summary', 'source', 'sentiment', 'published_at', 'url'],
                order: [['published_at', 'DESC']],
                limit: 15,
            }),
            // The primary records. Public because they already are: each row links to the filing.
            db.InvestorFund.findAll({
                where: { investor_id: i.id },
                order: [[db.sequelize.literal('"filing_date" DESC NULLS LAST')]],
                limit: 200,
            }),
            db.InvestorPerson.findAll({
                where: { investor_id: i.id },
                attributes: ['id', 'full_name', 'relationships', 'city', 'state_or_country', 'filings_count', 'first_seen', 'last_seen'],
                order: [[db.sequelize.literal('"filings_count" DESC')], ['full_name', 'ASC']],
                limit: 100,
            }),
        ]);
        return sendSuccess(req, res, {
            investor: { ...publicInvestor(i), recent_investments: investments, news, funds, people },
        });
    } catch (e) { return next(e); }
}

// ── Places ────────────────────────────────────────────────────────────────────────────────
// The directory's index of countries -> states -> cities, with the counts that make each link
// worth clicking. Built from rows that actually exist, so a place with nothing in it is never
// offered as a page — the same rule the jobs portal follows.
const placeRows = async (table, extraWhere = '') => {
    // Raw SQL doesn't inherit the schema Sequelize sets per-model, so qualify it explicitly.
    const schema = db.sequelize.options.define?.schema || 'insiders';
    const [rows] = await db.sequelize.query(`
        SELECT country, country_slug, state, state_slug, city, city_slug, COUNT(*)::int AS n
          FROM "${schema}"."${table}"
         WHERE country_slug IS NOT NULL AND is_hidden = FALSE ${extraWhere}
      GROUP BY country, country_slug, state, state_slug, city, city_slug
    `);
    return rows;
};

async function listPlaces(req, res, next) {
    try {
        const [inv, fnd] = await Promise.all([
            placeRows('investors'),
            // Companies, not member profiles: the profiles table holds a handful of accounts,
            // while the companies table is the directory's actual founder-side coverage.
            placeRows('companies'),
        ]);

        const countries = new Map();
        const add = (r, key) => {
            if (!countries.has(r.country_slug)) {
                countries.set(r.country_slug, { name: r.country, slug: r.country_slug, investors: 0, founders: 0, states: new Map(), cities: new Map() });
            }
            const c = countries.get(r.country_slug);
            c[key] += r.n;

            if (r.state_slug) {
                if (!c.states.has(r.state_slug)) c.states.set(r.state_slug, { name: r.state, slug: r.state_slug, investors: 0, founders: 0, cities: new Map() });
                const st = c.states.get(r.state_slug);
                st[key] += r.n;
                if (r.city_slug) {
                    if (!st.cities.has(r.city_slug)) st.cities.set(r.city_slug, { name: r.city, slug: r.city_slug, investors: 0, founders: 0 });
                    st.cities.get(r.city_slug)[key] += r.n;
                }
            } else if (r.city_slug) {
                // Countries with no state layer (Singapore, UAE…) hang cities off the country.
                if (!c.cities.has(r.city_slug)) c.cities.set(r.city_slug, { name: r.city, slug: r.city_slug, investors: 0, founders: 0 });
                c.cities.get(r.city_slug)[key] += r.n;
            }
        };
        inv.forEach((r) => add(r, 'investors'));
        fnd.forEach((r) => add(r, 'founders'));

        const byName = (a, b) => a.name.localeCompare(b.name);
        const out = [...countries.values()]
            .map((c) => ({
                ...c,
                states: [...c.states.values()]
                    .map((st) => ({ ...st, cities: [...st.cities.values()].sort(byName) }))
                    .sort(byName),
                cities: [...c.cities.values()].sort(byName),
            }))
            .sort((a, b) => (b.investors + b.founders) - (a.investors + a.founders) || byName(a, b));

        return sendSuccess(req, res, {
            countries: out,
            totals: {
                countries: out.length,
                cities: out.reduce((n, c) => n + c.cities.length + c.states.reduce((m, st) => m + st.cities.length, 0), 0),
                investors: inv.reduce((n, r) => n + r.n, 0),
                founders: fnd.reduce((n, r) => n + r.n, 0),
            },
        });
    } catch (e) { return next(e); }
}

// ── Sitemap ───────────────────────────────────────────────────────────────────────────────
// Emitted here rather than generated at build time so it can never disagree with the links:
// the same withSlug() that builds a profile's URL builds its sitemap entry, and a place appears
// only if it still has rows. lastmod is the record's own updated_at — never "now", which would
// tell Google every page changed on every crawl.
const SITE = (process.env.PUBLIC_SITE_URL || 'https://www.marketunderworld.com').replace(/\/$/, '');
const xmlEscape = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

// A sitemap file may hold at most 50,000 URLs, and the directory passed that the moment the
// company side landed (53,586). /sitemap.xml is therefore an index; each section is its own file,
// chunked well under the limit so it never has to be re-split as the directory grows.
const SITEMAP_CHUNK = 20000;

const xmlDoc = (inner, root = 'urlset') =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${inner}\n</${root}>\n`;

const sendXml = (res, body) => {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(body);
};

const urlTag = (u) =>
    `  <url><loc>${xmlEscape(SITE + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`;

// Place URLs for one side, deduped across the country / state / city levels.
function placeUrls(base, rows) {
    const seen = new Set();
    const out = [];
    for (const r of rows) {
        const paths = [
            r.country_slug && [r.country_slug],
            r.country_slug && r.state_slug && [r.country_slug, r.state_slug],
            r.country_slug && r.state_slug && r.city_slug && [r.country_slug, r.state_slug, r.city_slug],
            // A city-state's city page would duplicate its country page exactly — skip it.
            r.country_slug && !r.state_slug && r.city_slug && r.city_slug !== r.country_slug && [r.country_slug, r.city_slug],
        ].filter(Boolean);
        for (const parts of paths) {
            const loc = `/${base}/in/${parts.join('/')}`;
            if (seen.has(loc)) continue;
            seen.add(loc);
            out.push({ loc, priority: '0.7' });
        }
    }
    return out;
}

// A person is identified by name alone (Form D gives no id), so the sitemap lists distinct
// name-slugs across both sides — the same key /people/:slug resolves by.
const peopleSlugSql = (schema) => `
    SELECT DISTINCT regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g') AS slug
      FROM "${schema}"."investor_people" p
      JOIN "${schema}"."investors" i ON i.id = p.investor_id AND i.is_hidden = FALSE
     UNION
    SELECT DISTINCT regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g') AS slug
      FROM "${schema}"."company_people" p
      JOIN "${schema}"."companies" c ON c.id = p.company_id AND c.is_hidden = FALSE
`;
const schemaName = () => db.sequelize.options.define?.schema || 'insiders';

async function distinctPeopleCount() {
    const [row] = await db.sequelize.query(
        `SELECT COUNT(*)::int AS n FROM (${peopleSlugSql(schemaName())}) s`,
        { type: db.sequelize.QueryTypes.SELECT },
    );
    return Number(row?.n || 0);
}

// A person named on a single filing has one fact to their name — roughly fifteen words. That is a
// real record and it stays reachable, but it is not a page worth asking Google to index, and
// 148,906 of them would drown the 32,839 that genuinely say something.
const INDEXABLE_PEOPLE_SQL = (schema) => `
    SELECT slug FROM (
        SELECT regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g') AS slug
          FROM "${schema}"."investor_people" p
          JOIN "${schema}"."investors" i ON i.id = p.investor_id AND i.is_hidden = FALSE
         UNION ALL
        SELECT regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g')
          FROM "${schema}"."company_people" p
          JOIN "${schema}"."companies" c ON c.id = p.company_id AND c.is_hidden = FALSE
    ) a
    GROUP BY slug HAVING COUNT(*) >= 2
`;

async function distinctIndexablePeople() {
    const [row] = await db.sequelize.query(
        `SELECT COUNT(*)::int AS n FROM (${INDEXABLE_PEOPLE_SQL(schemaName())}) s`,
        { type: db.sequelize.QueryTypes.SELECT },
    );
    return Number(row?.n || 0);
}

async function peoplePage(offset, limit) {
    return db.sequelize.query(
        `SELECT slug FROM (${INDEXABLE_PEOPLE_SQL(schemaName())}) s ORDER BY slug LIMIT :limit OFFSET :offset`,
        { replacements: { limit, offset }, type: db.sequelize.QueryTypes.SELECT },
    );
}

// Facet pages ("biotech companies in San Francisco") are emitted only where at least MIN_FACET
// records exist, so a crawler is never offered a page with two rows on it.
const MIN_FACET = 3;
const slugExpr = (col) => `regexp_replace(lower(${col}), '[^a-z0-9]+', '-', 'g')`;

async function facetUrls() {
    const schema = schemaName();
    const [inv, co] = await Promise.all([
        db.sequelize.query(`
            SELECT ${slugExpr('firm_type')} f, country_slug, state_slug, city_slug, COUNT(*)::int n
              FROM "${schema}"."investors"
             WHERE is_hidden = FALSE AND firm_type IS NOT NULL
          GROUP BY GROUPING SETS ((1),(1,2),(1,2,3),(1,2,3,4))
            HAVING COUNT(*) >= ${MIN_FACET}`, { type: db.sequelize.QueryTypes.SELECT }),
        db.sequelize.query(`
            SELECT ${slugExpr('industry_group')} f, country_slug, state_slug, city_slug, COUNT(*)::int n
              FROM "${schema}"."companies"
             WHERE is_hidden = FALSE AND industry_group IS NOT NULL
          GROUP BY GROUPING SETS ((1),(1,2),(1,2,3),(1,2,3,4))
            HAVING COUNT(*) >= ${MIN_FACET}`, { type: db.sequelize.QueryTypes.SELECT }),
    ]);
    const out = [];
    const push = (base, marker, r) => {
        if (!r.f) return;
        // A grouping set can yield a city without its state; skip those rather than emit a URL
        // whose middle segment is missing.
        if (r.city_slug && !r.country_slug) return;
        if (r.state_slug && !r.country_slug) return;
        const parts = [r.country_slug, r.state_slug, r.city_slug].filter(Boolean);
        const loc = `/${base}/${marker}/${r.f}${parts.length ? `/in/${parts.join('/')}` : ''}`;
        out.push({ loc, priority: parts.length ? '0.6' : '0.7' });
    };
    inv.forEach((r) => push('investors', 'type', r));
    co.forEach((r) => push('founders', 'sector', r));
    return out;
}

async function sitemapIndex(req, res, next) {
    try {
        const [investors, companies, invPlaces, coPlaces, people] = await Promise.all([
            db.Investor.count({ where: VISIBLE }),
            db.Company.count({
                where: {
                    ...VISIBLE,
                    [Op.or]: [
                        { filing_count: { [Op.gt]: 0 } },
                        { employees: { [Op.ne]: null } },
                        { total_raised_usd: { [Op.ne]: null } },
                    ],
                },
            }),
            placeRows('investors'),
            placeRows('companies'),
            distinctIndexablePeople(),
        ]);
        const places = placeUrls('investors', invPlaces).length + placeUrls('founders', coPlaces).length;

        const sections = ['core'];
        if (places) sections.push('places');
        sections.push('facets');
        for (let i = 1; i <= Math.ceil(investors / SITEMAP_CHUNK); i++) sections.push(`investors-${i}`);
        for (let i = 1; i <= Math.ceil(companies / SITEMAP_CHUNK); i++) sections.push(`companies-${i}`);
        for (let i = 1; i <= Math.ceil(people / SITEMAP_CHUNK); i++) sections.push(`people-${i}`);

        // The index obeys the same rule as the URLs it points at: lastmod is the newest record the
        // section actually contains, not "now". Stamping today on all 13 told Google every section
        // changed on every crawl, which is the one thing the per-URL lastmod above avoids.
        const newest = async (model) => iso((await model.max('updated_at')) || null);
        const [invMod, coMod, guideMod] = await Promise.all([
            newest(db.Investor), newest(db.Company), newest(db.Article),
        ]);
        // Places and facets are derived from both tables; people from both people tables.
        const bothMod = [invMod, coMod].filter(Boolean).sort().pop() || null;
        const lastmodFor = (name) => {
            if (name === 'core') return [guideMod, bothMod].filter(Boolean).sort().pop();
            if (name === 'places' || name === 'facets' || name.startsWith('people-')) return bothMod;
            if (name.startsWith('investors-')) return invMod;
            if (name.startsWith('companies-')) return coMod;
            return bothMod;
        };
        const inner = sections
            .map((name) => {
                const lm = lastmodFor(name);
                return `  <sitemap><loc>${xmlEscape(`${SITE}/sitemap-${name}.xml`)}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ''}</sitemap>`;
            })
            .join('\n');
        return sendXml(res, xmlDoc(inner, 'sitemapindex'));
    } catch (e) { return next(e); }
}

async function sitemapSection(req, res, next) {
    try {
        const section = String(req.params.section || '');
        let urls = [];

        if (section === 'core') {
            const guides = await db.Article.findAll({ attributes: ['slug', 'updated_at'], where: { published_at: { [Op.ne]: null } } });
            urls = [
                { loc: '/', priority: '1.0' },
                { loc: '/investors', priority: '0.9' },
                { loc: '/founders', priority: '0.9' },
                { loc: '/directory', priority: '0.8' },
                { loc: '/guides', priority: '0.8' },
                ...guides.map((g) => ({ loc: `/guides/${g.slug}`, lastmod: iso(g.updated_at), priority: '0.7' })),
            ];
        } else if (section === 'places') {
            const [invPlaces, coPlaces] = await Promise.all([placeRows('investors'), placeRows('companies')]);
            urls = [...placeUrls('investors', invPlaces), ...placeUrls('founders', coPlaces)];
        } else if (section === 'facets') {
            urls = await facetUrls();
        } else if (/^people-\d+$/.test(section)) {
            const page = Math.max(parseInt(section.split('-')[1], 10), 1);
            urls = (await peoplePage((page - 1) * SITEMAP_CHUNK, SITEMAP_CHUNK))
                .map((r) => ({ loc: `/people/${r.slug}`, priority: '0.5' }));
        } else {
            const m = section.match(/^(investors|companies)-(\d+)$/);
            if (!m) throw new AppError('NOT_FOUND', 'Unknown sitemap section', 404);
            const page = Math.max(parseInt(m[2], 10), 1);
            const offset = (page - 1) * SITEMAP_CHUNK;
            if (m[1] === 'investors') {
                const rows = await db.Investor.findAll({
                    attributes: ['id', 'name', 'firm', 'updated_at'], where: VISIBLE,
                    order: [['id', 'ASC']], limit: SITEMAP_CHUNK, offset,
                });
                urls = rows.map((i) => ({ loc: `/investors/${withSlug(i.firm || i.name, i.id)}`, lastmod: iso(i.updated_at), priority: '0.6' }));
            } else {
                const rows = await db.Company.findAll({
                    attributes: ['id', 'name', 'updated_at'],
                    where: {
                        ...VISIBLE,
                        [Op.or]: [
                            { filing_count: { [Op.gt]: 0 } },
                            { employees: { [Op.ne]: null } },
                            { total_raised_usd: { [Op.ne]: null } },
                        ],
                    },
                    order: [['id', 'ASC']], limit: SITEMAP_CHUNK, offset,
                });
                urls = rows.map((c) => ({ loc: `/founders/${withSlug(c.name, c.id)}`, lastmod: iso(c.updated_at), priority: '0.6' }));
            }
        }

        if (!urls.length) throw new AppError('NOT_FOUND', 'Empty sitemap section', 404);
        return sendXml(res, xmlDoc(urls.map(urlTag).join('\n')));
    } catch (e) { return next(e); }
}

// One person, every filing they are named on, across both sides. This is the join the raw data
// makes possible and nothing else exposes: a partner at a fund who also sits on four boards shows
// up once, with all five roles.
async function getPerson(req, res, next) {
    try {
        const slug = String(req.params.slug || '');
        // The slug is the name; there is no id for a person in Form D, so names are matched
        // exactly after slugging. Two different people sharing a name will share a page — the
        // affiliations make that visible rather than silently merging them into one biography.
        const schema = db.sequelize.options.define?.schema || 'insiders';
        const rows = await db.sequelize.query(`
            SELECT p.full_name, p.relationships, p.city, p.state_or_country,
                   p.filings_count, p.first_seen, p.last_seen,
                   'investor' AS side, i.id AS entity_id, i.name AS entity_name,
                   i.city AS entity_city, i.state AS entity_state, i.country AS entity_country,
                   i.firm_type AS entity_kind
              FROM "${schema}"."investor_people" p
              JOIN "${schema}"."investors" i ON i.id = p.investor_id AND i.is_hidden = FALSE
             WHERE regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g') = :slug
             UNION ALL
            SELECT p.full_name, p.relationships, p.city, p.state_or_country,
                   p.filings_count, p.first_seen, p.last_seen,
                   'company' AS side, c.id AS entity_id, c.name AS entity_name,
                   c.city AS entity_city, c.state AS entity_state, c.country AS entity_country,
                   c.industry_group AS entity_kind
              FROM "${schema}"."company_people" p
              JOIN "${schema}"."companies" c ON c.id = p.company_id AND c.is_hidden = FALSE
             WHERE regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g') = :slug
             ORDER BY last_seen DESC NULLS LAST
             LIMIT 200
        `, { replacements: { slug: slug.replace(/^-+|-+$/g, '') }, type: db.sequelize.QueryTypes.SELECT });

        if (!rows.length) throw new AppError('NOT_FOUND', 'Person not found', 404);

        const affiliations = rows.map((r) => ({ ...r, entity_slug: withSlug(r.entity_name, r.entity_id) }));
        return sendSuccess(req, res, {
            person: {
                slug,
                full_name: affiliations[0].full_name,
                city: affiliations.find((a) => a.city)?.city || null,
                state_or_country: affiliations.find((a) => a.state_or_country)?.state_or_country || null,
                first_seen: affiliations.reduce((m, a) => (!m || (a.first_seen && a.first_seen < m) ? a.first_seen : m), null),
                last_seen: affiliations.reduce((m, a) => (!m || (a.last_seen && a.last_seen > m) ? a.last_seen : m), null),
                affiliations,
            },
        });
    } catch (e) { return next(e); }
}

// ── Articles ──────────────────────────────────────────────────────────────────────────────
// The directory answers "who funds companies like mine". These answer what the filings cannot:
// how the records work, what they prove and what they do not.
const ARTICLE_LIST_COLS = ['id', 'slug', 'title', 'summary', 'topic', 'reading_mins', 'published_at', 'updated_at'];

async function listArticles(req, res, next) {
    try {
        const where = { published_at: { [Op.ne]: null } };
        if (req.query.topic) where.topic = String(req.query.topic);
        const articles = await db.Article.findAll({
            attributes: ARTICLE_LIST_COLS,
            where,
            order: [['published_at', 'DESC']],
            limit: 200,
        });
        const topics = await db.Article.findAll({
            attributes: ['topic', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']],
            where: { published_at: { [Op.ne]: null }, topic: { [Op.ne]: null } },
            group: ['topic'], order: [['topic', 'ASC']], raw: true,
        });
        return sendSuccess(req, res, { articles, topics: topics.map((t) => ({ value: t.topic, n: Number(t.n) })) });
    } catch (e) { return next(e); }
}

async function getArticle(req, res, next) {
    try {
        const article = await db.Article.findOne({ where: { slug: String(req.params.slug), published_at: { [Op.ne]: null } } });
        if (!article) throw new AppError('NOT_FOUND', 'Article not found', 404);
        const related = await db.Article.findAll({
            attributes: ARTICLE_LIST_COLS,
            where: { topic: article.topic, slug: { [Op.ne]: article.slug }, published_at: { [Op.ne]: null } },
            limit: 4,
        });
        return sendSuccess(req, res, { article, related });
    } catch (e) { return next(e); }
}

module.exports = { listFounders, getFounder, listInvestors, getInvestor, listPlaces, sitemapIndex, sitemapSection, listCompanies, getCompany, searchPeople, getPerson, listArticles, getArticle };
