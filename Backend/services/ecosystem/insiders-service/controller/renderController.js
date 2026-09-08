'use strict';
/**
 * Server-rendered HTML for crawlers.
 *
 * The directory is a client-rendered SPA, so index.html is 219 characters and every one of its
 * ~318,000 URLs returns the same generic <title>. Googlebot executes JavaScript and eventually
 * sees the real page, but it does so on a rendering budget that 318k URLs will never fit inside —
 * and the AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot, Bingbot's older paths) largely do
 * not execute JavaScript at all. To them the whole site is one page repeated 318,000 times.
 *
 * This renders a real document per URL: correct title and description, canonical, JSON-LD, an h1,
 * the actual figures, and links onward so a crawler can walk the directory. It reads the same
 * tables the API does, so it cannot drift from what a human sees.
 */
const db = require('../models');
const { Op } = require('sequelize');

const SITE = (process.env.PUBLIC_SITE_URL || 'https://www.marketunderworld.com').replace(/\/$/, '');
const esc = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[c]));
const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const withSlug = (base, id) => `${slugify(base) || 'profile'}-${String(id).slice(0, 8)}`;
const titleCase = (slug) => String(slug || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const money = (n) => {
    if (n == null) return '—';
    const v = Number(n);
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
    if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
    return `$${v}`;
};
const place = (r) => [r.city, r.state, r.country].filter(Boolean).join(', ') || r.location || '';

function page({ title, description, canonical, jsonLd, h1, lede, facts = [], sections = [], noIndex = false }) {
    const factHtml = facts.length
        ? `<dl>${facts.filter(([, v]) => v).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`
        : '';
    const sectionHtml = sections.map((s) => `
    <section>
      <h2>${esc(s.title)}</h2>
      ${s.rows?.length ? `<ul>${s.rows.map((r) => `<li><a href="${esc(SITE + r.href)}">${esc(r.label)}</a>${r.meta ? ` — ${esc(r.meta)}` : ''}</li>`).join('')}</ul>` : ''}
      ${s.text ? `<p>${esc(s.text)}</p>` : ''}
    </section>`).join('');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="${noIndex ? 'noindex, follow' : 'index, follow'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="website">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
<header><a href="${SITE}/">Baalvion Insiders</a> · <a href="${SITE}/investors">Investors</a> · <a href="${SITE}/founders">Companies</a> · <a href="${SITE}/directory">Locations</a></header>
<main>
<h1>${esc(h1)}</h1>
${lede ? `<p>${esc(lede)}</p>` : ''}
${factHtml}
${sectionHtml}
</main>
<footer><p>Compiled from public records: SEC Form D filings and national company registers. Figures are as filed.</p></footer>
</body>
</html>`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function byIdOrSlug(model, param) {
    const raw = String(param || '');
    if (UUID_RE.test(raw)) return model.findByPk(raw);
    const prefix = (raw.match(/([0-9a-f]{8})$/i) || [])[1];
    if (!prefix) return null;
    const [row] = await model.findAll({
        where: db.sequelize.where(db.sequelize.cast(db.sequelize.col('id'), 'text'), { [Op.like]: `${prefix.toLowerCase()}%` }),
        limit: 1,
    });
    return row && row.is_hidden !== true ? row : null;
}

async function renderPath(path) {
    const clean = String(path || '/').split('?')[0].replace(/\/+$/, '') || '/';
    const parts = clean.split('/').filter(Boolean);

    if (parts[0] === 'guides') {
        if (!parts[1]) {
            const rows = await db.Article.findAll({ where: { published_at: { [Op.ne]: null } }, order: [['published_at', 'DESC']], limit: 200 });
            return page({
                title: 'Guides — How to read investor filings and use them to raise | Baalvion',
                description: 'Short, practical guides to the public records behind the directory: what a Form D filing proves, why cheque sizes are rarely published, and how to choose which investors to approach.',
                canonical: `${SITE}/guides`, h1: 'How to read the record',
                lede: 'What the underlying filings do and do not prove.',
                jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Guides' },
                sections: [{ title: 'Guides', rows: rows.map((a) => ({ href: `/guides/${a.slug}`, label: a.title, meta: a.summary })) }],
            });
        }
        const a = await db.Article.findOne({ where: { slug: parts[1], published_at: { [Op.ne]: null } } });
        if (!a) return null;
        // Render the body as real paragraphs — a crawler that only gets a summary learns nothing.
        const bodyHtml = String(a.body || '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
            .map((b) => (b.startsWith('## ') ? `<h2>${esc(b.slice(3))}</h2>` : `<p>${esc(b.replace(/\*\*/g, ''))}</p>`)).join('\n');
        const doc = page({
            title: `${a.title} | Baalvion`,
            description: a.summary,
            canonical: `${SITE}/guides/${a.slug}`,
            h1: a.title, lede: a.summary,
            jsonLd: {
                '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.summary,
                datePublished: a.published_at, dateModified: a.updated_at,
                author: { '@type': 'Organization', name: 'Baalvion' },
            },
        });
        return doc.replace('</main>', `${bodyHtml}\n</main>`);
    }

    // /investors/type/:facet[/in/...]  and  /founders/sector/:facet[/in/...]
    if ((parts[0] === 'investors' && parts[1] === 'type') || (parts[0] === 'founders' && parts[1] === 'sector')) {
        const isInv = parts[0] === 'investors';
        const facet = parts[2];
        const rest = parts[3] === 'in' ? parts.slice(4) : [];
        const [country, second, third] = rest;
        const model = isInv ? db.Investor : db.Company;
        const col = isInv ? 'firm_type' : 'industry_group';
        const where = {
            is_hidden: false,
            [Op.and]: [db.sequelize.where(
                db.sequelize.fn('regexp_replace', db.sequelize.fn('lower', db.sequelize.col(col)), '[^a-z0-9]+', '-', 'g'),
                String(facet),
            )],
        };
        if (country) where.country_slug = country;
        if (third) { where.state_slug = second; where.city_slug = third; }
        else if (second) where.state_slug = second;
        const [total, rows] = await Promise.all([
            model.count({ where }),
            model.findAll({ where, limit: 50, order: [db.sequelize.literal('"last_filing_date" DESC NULLS LAST')] }),
        ]);
        if (!total) return null;
        const label = rows[0] ? (isInv ? rows[0].firm_type : rows[0].industry_group) : titleCase(facet);
        const placeName = third || second || country ? titleCase(third || second || country) : null;
        const scope = `${label} ${isInv ? 'firms' : 'companies'}${placeName ? ` in ${placeName}` : ''}`;
        return page({
            title: `${scope} — ${total.toLocaleString()} on the public record | Baalvion`,
            description: `${total.toLocaleString()} ${label.toLowerCase()} ${isInv ? 'investment firms' : 'companies'}${placeName ? ` based in ${placeName}` : ''}, compiled from public filings and company registers.`,
            canonical: `${SITE}${clean}`,
            h1: scope,
            lede: `${total.toLocaleString()} records on the public file.`,
            jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: scope, numberOfItems: total },
            sections: [{
                title: scope,
                rows: rows.map((r) => ({
                    href: isInv ? `/investors/${withSlug(r.firm || r.name, r.id)}` : `/founders/${withSlug(r.name, r.id)}`,
                    label: r.name,
                    meta: place(r),
                })),
            }],
        });
    }

    // /investors/in/:country/:state?/:city?  and  /founders/in/...
    if ((parts[0] === 'investors' || parts[0] === 'founders') && parts[1] === 'in') {
        const isInv = parts[0] === 'investors';
        const [country, second, third] = [parts[2], parts[3], parts[4]];
        const model = isInv ? db.Investor : db.Company;
        const where = { is_hidden: false, country_slug: country };
        if (third) { where.state_slug = second; where.city_slug = third; }
        else if (second) where[Op.or] = [{ state_slug: second }, { state_slug: null, city_slug: second }];
        const [total, rows] = await Promise.all([
            model.count({ where }),
            model.findAll({ where, limit: 50, order: [db.sequelize.literal('"last_filing_date" DESC NULLS LAST')] }),
        ]);
        const name = titleCase(third || second || country);
        const noun = isInv ? 'Investors' : 'Companies';
        return page({
            title: `${noun} in ${name} — ${total.toLocaleString()} ${isInv ? 'venture capital & private equity firms' : 'businesses'} | Baalvion`,
            description: `${total.toLocaleString()} ${isInv ? 'investment firms' : 'companies'} based in ${name}, compiled from public filings and registers.`,
            canonical: `${SITE}${clean}`,
            h1: `${noun} in ${name}`,
            lede: `${total.toLocaleString()} records on the public file.`,
            jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${noun} in ${name}`, numberOfItems: total },
            sections: [{
                title: `${noun} in ${name}`,
                rows: rows.map((r) => ({
                    href: isInv ? `/investors/${withSlug(r.firm || r.name, r.id)}` : `/founders/${withSlug(r.name, r.id)}`,
                    label: r.name,
                    meta: [isInv ? r.firm_type : r.industry_group, place(r)].filter(Boolean).join(' · '),
                })),
            }],
        });
    }

    if (parts[0] === 'investors' && parts[1]) {
        const i = await byIdOrSlug(db.Investor, parts[1]);
        if (!i) return null;
        const [funds, people] = await Promise.all([
            db.InvestorFund.findAll({ where: { investor_id: i.id }, limit: 50, order: [db.sequelize.literal('"filing_date" DESC NULLS LAST')] }),
            db.InvestorPerson.findAll({ where: { investor_id: i.id }, limit: 50, order: [db.sequelize.literal('"filings_count" DESC')] }),
        ]);
        return page({
            title: `${i.name} — ${i.firm_type || 'Investor'} in ${place(i)} | Baalvion`,
            description: `${i.name} is a ${(i.firm_type || 'investment').toLowerCase()} firm in ${place(i)} with ${i.fund_count || funds.length} funds on record${i.total_raised_usd ? `, ${money(i.total_raised_usd)} raised` : ''}.`,
            canonical: `${SITE}/investors/${withSlug(i.firm || i.name, i.id)}`,
            h1: i.name,
            lede: [i.firm_type, i.entity_type, place(i)].filter(Boolean).join(' · '),
            jsonLd: {
                '@context': 'https://schema.org', '@type': 'Organization', name: i.name,
                address: place(i) || undefined, telephone: i.phone || undefined,
                employee: people.slice(0, 10).map((p) => ({ '@type': 'Person', name: p.full_name, jobTitle: (p.relationships || []).join(', ') || undefined })),
            },
            facts: [
                ['Type', i.firm_type], ['Based', place(i)],
                ['Capital raised across funds', i.total_raised_usd ? money(i.total_raised_usd) : null],
                ['Funds on record', i.fund_count ? String(i.fund_count) : null],
                ['First filing', i.first_filing_date], ['Most recent filing', i.last_filing_date],
                ['Address as filed', [i.street, place(i), i.postal_code].filter(Boolean).join(', ')],
                ['Telephone as filed', i.phone],
            ],
            sections: [
                { title: `Funds (${funds.length})`, rows: funds.map((f) => ({ href: `/investors/${withSlug(i.firm || i.name, i.id)}`, label: f.fund_name, meta: [f.fund_type, f.total_sold_usd ? `${money(f.total_sold_usd)} sold` : null, f.filing_date].filter(Boolean).join(' · ') })) },
                { title: `People named on the filings (${people.length})`, rows: people.map((p) => ({ href: `/people/${slugify(p.full_name)}`, label: p.full_name, meta: (p.relationships || []).join(', ') })) },
            ],
        });
    }

    if (parts[0] === 'founders' && parts[1]) {
        const c = await byIdOrSlug(db.Company, parts[1]);
        if (!c) return null;
        const [filings, people] = await Promise.all([
            db.CompanyFiling.findAll({ where: { company_id: c.id }, limit: 50, order: [db.sequelize.literal('"filing_date" DESC NULLS LAST')] }),
            db.CompanyPerson.findAll({ where: { company_id: c.id }, limit: 50, order: [db.sequelize.literal('"filings_count" DESC')] }),
        ]);
        const registry = c.source !== 'sec_form_d';
        return page({
            title: `${c.name} — ${c.industry_group || 'Company'} in ${place(c)} | Baalvion`,
            description: registry
                ? `${c.name} is a company registered in ${c.country}, based in ${place(c)}${c.industry_group ? `, working in ${c.industry_group.toLowerCase()}` : ''}.`
                : `${c.name} is a ${(c.industry_group || 'private').toLowerCase()} company in ${place(c)} with ${c.filing_count || filings.length} capital-raising filings on record${c.total_raised_usd ? `, ${money(c.total_raised_usd)} raised` : ''}.`,
            canonical: `${SITE}/founders/${withSlug(c.name, c.id)}`,
            h1: c.name,
            lede: [c.industry_group, c.entity_type || c.legal_form, place(c)].filter(Boolean).join(' · '),
            jsonLd: {
                '@context': 'https://schema.org', '@type': 'Organization', name: c.name,
                address: place(c) || undefined, telephone: c.phone || undefined,
                foundingDate: c.founded_on || (c.year_founded ? String(c.year_founded) : undefined),
                employee: people.slice(0, 10).map((p) => ({ '@type': 'Person', name: p.full_name, jobTitle: (p.relationships || []).join(', ') || undefined })),
            },
            noIndex: filings.length === 0 && c.employees == null && c.total_raised_usd == null,
            facts: [
                ['Sector', c.industry_group], ['Based', place(c)],
                ['Capital raised', c.total_raised_usd ? money(c.total_raised_usd) : null],
                ['Filings on record', c.filing_count ? String(c.filing_count) : null],
                ['Registered', c.founded_on], ['Employees', c.employees != null ? String(c.employees) : null],
                ['Register', c.registry_name], ['Registration number', c.registry_number],
                ['Address as filed', [c.street, place(c), c.postal_code].filter(Boolean).join(', ')],
                ['Telephone as filed', c.phone],
            ],
            sections: [
                { title: `Rounds (${filings.length})`, rows: filings.map((f) => ({ href: `/founders/${withSlug(c.name, c.id)}`, label: f.entity_name || c.name, meta: [f.total_sold_usd ? `${money(f.total_sold_usd)} sold` : null, f.filing_date].filter(Boolean).join(' · ') })) },
                { title: `People named on the filings (${people.length})`, rows: people.map((p) => ({ href: `/people/${slugify(p.full_name)}`, label: p.full_name, meta: (p.relationships || []).join(', ') })) },
            ],
        });
    }

    if (parts[0] === 'people' && parts[1]) {
        const schema = db.sequelize.options.define?.schema || 'insiders';
        const rows = await db.sequelize.query(`
            SELECT p.full_name, p.relationships, 'investor' AS side, i.id AS entity_id, i.name AS entity_name,
                   i.city AS c, i.state AS s, i.country AS co
              FROM "${schema}"."investor_people" p
              JOIN "${schema}"."investors" i ON i.id = p.investor_id AND i.is_hidden = FALSE
             WHERE regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g') = :slug
             UNION ALL
            SELECT p.full_name, p.relationships, 'company', c2.id, c2.name, c2.city, c2.state, c2.country
              FROM "${schema}"."company_people" p
              JOIN "${schema}"."companies" c2 ON c2.id = p.company_id AND c2.is_hidden = FALSE
             WHERE regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g') = :slug
             LIMIT 200`,
            { replacements: { slug: parts[1] }, type: db.sequelize.QueryTypes.SELECT });
        if (!rows.length) return null;
        const name = rows[0].full_name;
        const firms = rows.filter((r) => r.side === 'investor');
        const cos = rows.filter((r) => r.side === 'company');
        return page({
            title: `${name} — named on ${rows.length} SEC filing${rows.length === 1 ? '' : 's'} | Baalvion`,
            description: `${name} is named on SEC Form D filings for ${firms.length} investment firm${firms.length === 1 ? '' : 's'} and ${cos.length} compan${cos.length === 1 ? 'y' : 'ies'}.`,
            canonical: `${SITE}/people/${parts[1]}`,
            h1: name,
            lede: `Named on ${rows.length} public filing${rows.length === 1 ? '' : 's'}.`,
            jsonLd: { '@context': 'https://schema.org', '@type': 'Person', name, affiliation: rows.map((r) => ({ '@type': 'Organization', name: r.entity_name })) },
            noIndex: rows.length < 2,
            sections: [
                { title: `At investment firms (${firms.length})`, rows: firms.map((r) => ({ href: `/investors/${withSlug(r.entity_name, r.entity_id)}`, label: r.entity_name, meta: [(r.relationships || []).join(', '), [r.c, r.s, r.co].filter(Boolean).join(', ')].filter(Boolean).join(' · ') })) },
                { title: `At companies (${cos.length})`, rows: cos.map((r) => ({ href: `/founders/${withSlug(r.entity_name, r.entity_id)}`, label: r.entity_name, meta: [(r.relationships || []).join(', '), [r.c, r.s, r.co].filter(Boolean).join(', ')].filter(Boolean).join(' · ') })) },
            ],
        });
    }

    // Index pages
    const [investors, companies] = await Promise.all([
        db.Investor.count({ where: { is_hidden: false } }),
        db.Company.count({ where: { is_hidden: false } }),
    ]);
    if (parts[0] === 'investors') {
        const rows = await db.Investor.findAll({ where: { is_hidden: false }, limit: 50, order: [db.sequelize.literal('"last_filing_date" DESC NULLS LAST')] });
        return page({
            title: `Investor Directory — ${investors.toLocaleString()} Venture Capital & Private Equity Firms | Baalvion`,
            description: `Search ${investors.toLocaleString()} investment firms by sector, stage, cheque size and location, compiled from SEC Form D filings.`,
            canonical: `${SITE}/investors`, h1: 'Investor directory',
            lede: `${investors.toLocaleString()} firms on the public file.`,
            jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Investor Directory', numberOfItems: investors },
            sections: [{ title: 'Most recent filings', rows: rows.map((r) => ({ href: `/investors/${withSlug(r.firm || r.name, r.id)}`, label: r.name, meta: [r.firm_type, place(r)].filter(Boolean).join(' · ') })) }],
        });
    }
    if (parts[0] === 'founders') {
        const rows = await db.Company.findAll({ where: { is_hidden: false }, limit: 50, order: [db.sequelize.literal('"last_filing_date" DESC NULLS LAST')] });
        return page({
            title: `Company & Founder Directory — ${companies.toLocaleString()} Businesses | Baalvion`,
            description: `Browse ${companies.toLocaleString()} companies and the founders named on their public filings.`,
            canonical: `${SITE}/founders`, h1: 'Companies & founders',
            lede: `${companies.toLocaleString()} companies on the public file.`,
            jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Company Directory', numberOfItems: companies },
            sections: [{ title: 'Most recent filings', rows: rows.map((r) => ({ href: `/founders/${withSlug(r.name, r.id)}`, label: r.name, meta: [r.industry_group, place(r)].filter(Boolean).join(' · ') })) }],
        });
    }
    if (parts[0] === 'directory') {
        const [rows] = await db.sequelize.query(`
            SELECT country, country_slug, COUNT(*)::int n FROM "${db.sequelize.options.define?.schema || 'insiders'}"."companies"
             WHERE country_slug IS NOT NULL AND is_hidden = FALSE GROUP BY 1,2 ORDER BY n DESC LIMIT 200`);
        return page({
            title: 'Browse investors and companies by country, state and city | Baalvion',
            description: 'The full geographic index of the directory — every country, state and city with records, with counts.',
            canonical: `${SITE}/directory`, h1: 'Browse by location',
            jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Directory by location' },
            sections: [{ title: 'Countries', rows: rows.map((r) => ({ href: `/founders/in/${r.country_slug}`, label: r.country, meta: `${r.n.toLocaleString()} companies` })) }],
        });
    }

    return page({
        title: 'Baalvion Insiders — Find the investors who fund companies like yours',
        description: `A free directory of ${investors.toLocaleString()} investment firms and ${companies.toLocaleString()} companies, compiled from SEC filings and national company registers.`,
        canonical: `${SITE}/`, h1: 'Find the investors who fund companies like yours',
        lede: 'Search active funds, angels, family offices and corporate investors by sector, stage, cheque size and location. Free to search, no account needed.',
        jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Baalvion Insiders', url: `${SITE}/` },
        facts: [['Investment firms', investors.toLocaleString()], ['Companies', companies.toLocaleString()]],
        sections: [{ title: 'Start here', rows: [
            { href: '/investors', label: 'Investor directory' },
            { href: '/founders', label: 'Companies and founders' },
            { href: '/directory', label: 'Browse by location' },
        ] }],
    });
}

async function render(req, res, next) {
    try {
        const html = await renderPath(req.query.path || '/');
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
        if (!html) return res.status(404).send(page({
            title: 'Not found | Baalvion', description: 'This page does not exist.',
            canonical: `${SITE}/`, h1: 'Not found',
            sections: [{ title: 'Try', rows: [{ href: '/investors', label: 'Investor directory' }] }],
        }));
        return res.send(html);
    } catch (e) { return next(e); }
}

module.exports = { render, renderPath };
