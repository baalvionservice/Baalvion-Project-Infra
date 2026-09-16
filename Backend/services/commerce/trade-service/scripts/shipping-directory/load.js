'use strict';
/**
 * Stage F — load the fetched caches into tradeops.carriers / tradeops.vessels /
 * tradeops.carrier_fleet_history, and compute the rollups the directory reads.
 *
 * Idempotent: keyed on wikidata_qid (and IMO number for vessels), so re-running updates
 * in place. Rows this ingest owns are stamped data_source='wikidata'; nothing else is
 * touched, so hand-entered or carrier-API rows survive a re-run.
 *
 * THE TWO FLEET NUMBERS ARE KEPT APART ON PURPOSE — see migration 067. registry_* is
 * counted from vessels we actually hold. reported_* is the company's published figure
 * with its citation. They differ by an order of magnitude for the big lines and merging
 * them would publish a false fleet size.
 *
 *   node scripts/shipping-directory/load.js
 */
const fs = require('fs');
const path = require('path');
const db = require('../../models');
const { classifyVessel, classifyCompany } = require('./classify');
const { imoCheckDigitValid } = require('./fetch-vessels');
const { cleanVesselName, isPlaceholderName } = require('./fetch-vessel-names');
const { isPlaceholderCompanyName } = require('./fetch-company-names');
const { CURRENCY_QIDS } = require('./fetch-company-depth');

const CACHE = path.join(__dirname, '.cache');
const TENANT = 'GLOBAL';
const CHUNK = 500;

const readJson = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : fallback);

function loadVesselCache() {
    const dir = path.join(CACHE, 'vessels');
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
        out.push(...JSON.parse(fs.readFileSync(path.join(dir, f))));
    }
    return out;
}

function slugify(s) {
    return String(s || '')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || null;
}

function uniqueSlugger() {
    const seen = new Map();
    return (base, discriminator) => {
        let s = slugify(base) || slugify(discriminator) || 'unnamed';
        if (!seen.has(s)) { seen.set(s, 1); return s; }
        // Disambiguate with the stable id rather than a counter, so slugs don't shuffle
        // between runs when a new same-named company appears.
        const withId = `${s}-${slugify(discriminator) || seen.get(s)}`;
        seen.set(s, seen.get(s) + 1);
        if (!seen.has(withId)) { seen.set(withId, 1); return withId; }
        let n = 2;
        while (seen.has(`${withId}-${n}`)) n += 1;
        seen.set(`${withId}-${n}`, 1);
        return `${withId}-${n}`;
    };
}

async function bulkUpsert(table, columns, rows, conflictTarget, updateColumns, extraConflict = '') {
    let written = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const params = [];
        const tuples = chunk.map((r) => {
            const ph = columns.map((c) => { params.push(r[c] === undefined ? null : r[c]); return `$${params.length}`; });
            return `(${ph.join(',')})`;
        });
        const setClause = updateColumns.map((c) => `${c} = EXCLUDED.${c}`).join(', ');
        const sql = `
            INSERT INTO ${table} (${columns.join(',')})
            VALUES ${tuples.join(',')}
            ON CONFLICT (${conflictTarget}) ${extraConflict} DO UPDATE SET ${setClause}, updated_at = now()`;
        await db.sequelize.query(sql, { bind: params, logging: false });
        written += chunk.length;
        if (rows.length > 2000) process.stdout.write(`\r    ${written}/${rows.length}`);
    }
    if (rows.length > 2000) process.stdout.write('\r');
    return written;
}

async function main() {
    const started = Date.now();
    const vessels = loadVesselCache();
    const companies = readJson(path.join(CACHE, 'companies.json'), []);
    const labels = readJson(path.join(CACHE, 'labels.json'), {});
    const reported = readJson(path.join(CACHE, 'reported-fleets.json'), { rows: [] });
    // Names for the ~3% of vessels with no English label — the name exists, just in
    // another language. Without this they publish as "IMO 9648714".
    const fallbackNames = readJson(path.join(CACHE, 'vessel-names.json'), {});
    // Names for the ~10% of companies with no English label — same defect, other table.
    // Without this, 186 real shipping companies published under their raw QID.
    const companyNames = readJson(path.join(CACHE, 'company-names.json'), {});
    // The depth layer: founders, leadership, ownership, financials, HQ coordinates.
    const depth = readJson(path.join(CACHE, 'company-depth.json'), { companies: [], entities: {} });
    const depthByQid = new Map((depth.companies || []).map((c) => [c.qid, c]));
    const entities = depth.entities || {};
    // Quoted encyclopaedic prose, and attribution for every photograph.
    const wpCompanies = readJson(path.join(CACHE, 'wikipedia-companies.json'), {});
    const wpVessels = readJson(path.join(CACHE, 'wikipedia-vessels.json'), {});
    const imageCredits = readJson(path.join(CACHE, 'image-credits.json'), {});
    const vesselDepth = readJson(path.join(CACHE, 'vessel-depth.json'), {});
    /**
     * Wikipedia ship infoboxes — deadweight, owner, operator, beam, draft and a stated
     * type, for the ~3,300 vessels with an article. These fill gaps Wikidata does not
     * cover; the commercial source that would (Equasis) forbids extraction outright.
     *
     * PRECEDENCE: structured Wikidata always wins where it has a value. The infobox is
     * parsed out of wikitext, which is prose formatting rather than a data format, so it
     * is the fallback and never the override.
     */
    const infoboxes = readJson(path.join(CACHE, 'infoboxes.json'), {});

    if (!vessels.length) throw new Error('vessel cache empty — run fetch-vessels.js first');
    if (!companies.length) throw new Error('company cache empty — run fetch-companies.js first');
    console.log(`[load] caches: ${vessels.length} vessels, ${companies.length} companies, ${Object.keys(labels).length} labels, ${reported.rows.length} reported fleets, ${Object.keys(fallbackNames).length} fallback names`);
    console.log(`[load] depth:  ${depthByQid.size} company profiles, ${Object.keys(entities).length} referenced entities, ${Object.keys(wpCompanies).filter((k) => wpCompanies[k]).length} company summaries, ${Object.keys(wpVessels).filter((k) => wpVessels[k]).length} ship summaries, ${Object.keys(imageCredits).filter((k) => imageCredits[k]).length} image credits, ${Object.keys(vesselDepth).filter((k) => vesselDepth[k]).length} enriched hulls`);

    /**
     * A photograph is publishable only if we know who made it AND that its licence
     * permits reuse. Anything else returns null and the image is not written, so a page
     * can never show a picture it cannot attribute.
     */
    const creditFor = (url) => {
        const c = url && imageCredits[url];
        if (!c || c.usable === false) return null;
        if (!c.author && !c.licence) return null;
        return {
            author: c.author || null,
            licence: c.licence || null,
            licenceUrl: c.licenceUrl || null,
            descriptionUrl: c.descriptionUrl || null,
            usable: true,
        };
    };
    const imageIfCredited = (url) => (creditFor(url) ? url : null);
    /**
     * JSON.stringify(null) is the string "null", which Postgres stores as the JSONB null
     * LITERAL rather than SQL NULL — so `image_credit IS NOT NULL` matched every row,
     * including the ~79,000 vessels with no photograph at all. Absent means SQL NULL.
     */
    const jsonbOrNull = (v) => (v === null || v === undefined ? null : JSON.stringify(v));

    /** A referenced Wikidata entity as something a page can render. */
    const personFrom = (q, role) => {
        const e = entities[q];
        if (!e || !e.name || isPlaceholderCompanyName(e.name)) return null;
        return {
            qid: q,
            name: e.name,
            role: role || null,
            description: e.description || null,
            image: imageIfCredited(e.imageUrl),
            imageCredit: creditFor(e.imageUrl),
            bornYear: e.bornYear || null,
            diedYear: e.diedYear || null,
        };
    };
    const orgFrom = (q) => {
        const e = entities[q];
        if (!e || !e.name || isPlaceholderCompanyName(e.name)) return null;
        return { qid: q, name: e.name, description: e.description || null };
    };
    /**
     * Wikidata unit QIDs that turn up on vessel capacity statements. Resolved from a
     * fixed map rather than the entity cache: the depth pass collects company-side QIDs,
     * so a unit like "lane metre" has no entry there and would render as nothing.
     */
    const UNIT_LABELS = {
        Q488021: 'TEU', Q319604: 'passengers', Q215627: 'persons', Q5: 'passengers',
        Q1164756: 'lane metres', Q25517: 'cubic metres', Q1420: 'motor cars',
        Q191118: 'tonnes', Q11570: 'kg',
    };
    const entityLabel = (q) => (q && entities[q] && entities[q].name) || labelOf(q) || (q && UNIT_LABELS[q]) || null;
    const currencyOf = (unitQid) => {
        if (!unitQid) return null;
        if (unitQid in CURRENCY_QIDS) return CURRENCY_QIDS[unitQid];
        return entityLabel(unitQid);
    };

    const labelOf = (q) => (q && labels[q] && labels[q].label) || null;
    const iso2Of = (q) => (q && labels[q] && labels[q].iso2) || null;

    // ── Carriers ────────────────────────────────────────────────────────────────
    const reportedByQid = new Map(reported.rows.filter((r) => r.qid).map((r) => [r.qid, r]));
    const slugFor = uniqueSlugger();
    const carrierRows = [];
    const codeByQid = new Map();

    // Rank by published TEU is only meaningful among companies that have one.
    for (const c of companies) {
        const recovered = companyNames[c.qid];
        const name = (!isPlaceholderCompanyName(c.name) && c.name)
            || (!isPlaceholderCompanyName(c.officialName) && c.officialName)
            || (recovered && recovered.name)
            || labelOf(c.qid)
            || c.qid;
        const d = depthByQid.get(c.qid) || {};
        const wp = wpCompanies[c.qid] || null;
        const fin = d.financials || {};
        // One currency and one year for the whole block. Revenue is the anchor because it
        // is the figure most often quoted; a page that mixed a 2023 revenue with a 2016
        // asset total under one "as of" would be misreporting both.
        const anchor = fin.revenue || fin.totalAssets || fin.marketCap || fin.netProfit || null;
        const money = (m) => (m && anchor && m.year === anchor.year ? Math.round(m.amount) : null);
        const rep = reportedByQid.get(c.qid);
        const kind = classifyCompany(c.typeQids, labelOf, name);
        const code = c.qid;
        codeByQid.set(c.qid, code);
        carrierRows.push({
            code,
            name,
            slug: slugFor(name, c.qid),
            wikidata_qid: c.qid,
            legal_name: c.officialName || null,
            description: c.description || null,
            website: c.website || null,
            country: labelOf(c.countryQid),
            country_code: iso2Of(c.countryQid),
            headquarters: labelOf(c.hqQid) || (rep && rep.headquarters) || null,
            founded_year: c.foundedYear,
            company_type: kind,
            employee_count: c.employees != null ? Math.round(c.employees) : null,
            parent_name: labelOf(c.parentQid),
            alliance: (rep && rep.alliance) || null,
            // A logo with no usable licence is not shown; see creditFor.
            logo_url: imageIfCredited(c.logoUrl),
            data_source: 'wikidata',
            source_url: `https://www.wikidata.org/wiki/${c.qid}`,
            reported_fleet_size: rep ? rep.ships : null,
            reported_teu: rep ? rep.teu : null,
            market_share_pct: rep ? rep.marketSharePct : null,
            reported_source: rep ? reported.source : null,
            reported_source_url: rep ? reported.sourceUrl : null,
            reported_as_of: rep ? reported.asOf : null,
            capacity_rank: rep ? rep.rank : null,

            // ── depth ────────────────────────────────────────────────────────────
            founders: JSON.stringify((d.founderQids || []).map((q) => personFrom(q, 'Founder')).filter(Boolean)),
            key_people: JSON.stringify([
                ...(d.ceoQids || []).map((q) => personFrom(q, 'Chief executive')),
                ...(d.boardQids || []).map((q) => personFrom(q, 'Board member')),
            ].filter(Boolean)),
            subsidiaries: JSON.stringify((d.subsidiaryQids || []).map(orgFrom).filter(Boolean)),
            owners: JSON.stringify((d.ownerQids || []).map(orgFrom).filter(Boolean)),
            products: JSON.stringify((d.productQids || []).map(orgFrom).filter(Boolean)),
            industry: entityLabel(d.industryQid),
            legal_form: entityLabel(d.legalFormQid),
            formed_in: entityLabel(d.formedInQid),
            stock_exchange: entityLabel(d.exchangeQid),
            isin: d.isin || null,
            lei: d.lei || null,
            dissolved_year: d.dissolvedYear || null,

            revenue: money(fin.revenue),
            net_profit: money(fin.netProfit),
            operating_income: money(fin.operatingIncome),
            total_assets: money(fin.totalAssets),
            total_equity: money(fin.totalEquity),
            market_cap: money(fin.marketCap),
            financials_currency: anchor ? currencyOf(anchor.unitQid) : null,
            financials_as_of: anchor ? anchor.year : null,

            hq_lat: d.hqLat ?? null,
            hq_lon: d.hqLon ?? null,
            image_url: imageIfCredited(d.imageUrl),
            image_credit: jsonbOrNull(creditFor(d.imageUrl)),
            logo_credit: jsonbOrNull(creditFor(c.logoUrl)),

            wikipedia_title: wp ? wp.title : null,
            wikipedia_url: wp ? wp.url : null,
            summary: wp ? wp.summary : null,
            summary_fetched_at: wp ? new Date() : null,
            social: JSON.stringify(d.social || {}),

            last_ingested_at: new Date(),
        });
    }

    // Every ranked carrier that did not already get a row above. Two reasons a row can be
    // missing, and both are real: the company is a red link on Wikipedia with no Wikidata
    // item at all, OR it has one that is typed as a plain business and operates none of
    // our vessels, so neither population in fetch-companies.js picked it up. Keying on
    // "did a carrier row actually get built" rather than on "is the QID null" means a
    // published fleet figure can never be silently dropped.
    const builtQids = new Set(carrierRows.map((r) => r.wikidata_qid).filter(Boolean));
    for (const r of reported.rows.filter((x) => !x.qid || !builtQids.has(x.qid))) {
        const code = r.qid || `RF-${slugify(r.displayName)}`;
        carrierRows.push({
            code,
            name: r.displayName,
            slug: slugFor(r.displayName, code),
            wikidata_qid: r.qid || null,
            headquarters: r.headquarters || null,
            country: r.headquarters || null,
            company_type: 'commercial',
            alliance: r.alliance || null,
            data_source: 'alphaliner-wikipedia',
            source_url: r.qid ? `https://www.wikidata.org/wiki/${r.qid}` : reported.sourceUrl,
            reported_fleet_size: r.ships,
            reported_teu: r.teu,
            market_share_pct: r.marketSharePct,
            reported_source: reported.source,
            reported_source_url: reported.sourceUrl,
            reported_as_of: reported.asOf,
            capacity_rank: r.rank,
            // These carriers come from the published ranking alone — a Wikipedia red link
            // with no Wikidata item, so there is no depth to attach. The JSONB columns are
            // NOT NULL with an empty-array default, and an explicit '[]' is what "we hold
            // nothing here" means; letting them arrive as SQL NULL breaks the insert.
            founders: '[]',
            key_people: '[]',
            subsidiaries: '[]',
            owners: '[]',
            products: '[]',
            social: '{}',
            last_ingested_at: new Date(),
        });
    }

    const placedRanks = new Set(carrierRows.filter((r) => r.capacity_rank).map((r) => r.capacity_rank));
    const droppedRanks = reported.rows.map((r) => r.rank).filter((rank) => !placedRanks.has(rank));
    if (droppedRanks.length) {
        throw new Error(`[load] ${droppedRanks.length} published ranking rows found no carrier: ranks ${droppedRanks.join(',')}`);
    }
    console.log(`[load] all ${reported.rows.length} published ranking rows placed on a carrier`);

    const carrierCols = [
        'code', 'name', 'slug', 'wikidata_qid', 'legal_name', 'description', 'website', 'country',
        'country_code', 'headquarters', 'founded_year', 'company_type', 'employee_count', 'parent_name',
        'alliance', 'logo_url', 'data_source', 'source_url', 'reported_fleet_size', 'reported_teu',
        'market_share_pct', 'reported_source', 'reported_source_url', 'reported_as_of', 'capacity_rank',
        'founders', 'key_people', 'subsidiaries', 'owners', 'products', 'industry', 'legal_form',
        'formed_in', 'stock_exchange', 'isin', 'lei', 'dissolved_year', 'revenue', 'net_profit',
        'operating_income', 'total_assets', 'total_equity', 'market_cap', 'financials_currency',
        'financials_as_of', 'hq_lat', 'hq_lon', 'image_url', 'image_credit', 'logo_credit',
        'wikipedia_title', 'wikipedia_url', 'summary', 'summary_fetched_at', 'social',
        'last_ingested_at',
    ];
    console.log(`[load] upserting ${carrierRows.length} carriers...`);
    await bulkUpsert(
        'tradeops.carriers', carrierCols, carrierRows, 'code', carrierCols.filter((c) => c !== 'code'),
    );

    const [idRows] = await db.sequelize.query(
        `SELECT id, code, wikidata_qid FROM tradeops.carriers WHERE data_source IN ('wikidata','alphaliner-wikipedia')`,
    );
    const carrierIdByQid = new Map(idRows.filter((r) => r.wikidata_qid).map((r) => [r.wikidata_qid, r.id]));
    console.log(`[load] ${idRows.length} carrier rows resolved (${carrierIdByQid.size} with a QID)`);

    // ── Vessels ─────────────────────────────────────────────────────────────────
    // Two levels of de-duplication, both required by real data:
    //
    //  1. BY QID. A Wikidata item can carry more than one P458 value (a re-registration,
    //     or a plain error). The fetch buckets by IMO prefix, so such an item is returned
    //     once per bucket with a different SAMPLE'd IMO each time — the same ship arriving
    //     as several rows. wikidata_qid is UNIQUE, so without this the insert aborts.
    //     The IMO whose check digit validates wins; that is the one that is actually a
    //     well-formed IMO number.
    //  2. BY IMO. Distinct items occasionally claim the same IMO. imo_number is UNIQUE,
    //     so keep whichever row carries more information.
    const richness = (v) => [v.name, v.grossTonnage, v.builtYear, v.operatorQid || v.ownerQid, v.flagQid, v.imageUrl].filter(Boolean).length;
    const score = (v) => (imoCheckDigitValid(v.imo) ? 1000 : 0) + richness(v);

    const noImo = [];
    const byQid = new Map();
    let multiImoItems = 0;
    for (const v of vessels) {
        if (!v.imo) { noImo.push(v); continue; }
        const prev = byQid.get(v.qid);
        if (!prev) { byQid.set(v.qid, v); continue; }
        multiImoItems += 1;
        if (score(v) > score(prev)) byQid.set(v.qid, v);
    }

    const byImo = new Map();
    let imoCollisions = 0;
    let badCheckDigit = 0;
    for (const v of byQid.values()) {
        if (!imoCheckDigitValid(v.imo)) badCheckDigit += 1;
        const prev = byImo.get(v.imo);
        if (!prev) { byImo.set(v.imo, v); continue; }
        imoCollisions += 1;
        if (score(v) > score(prev)) byImo.set(v.imo, v);
    }
    console.log(`[load] ${byImo.size} unique vessels`);
    console.log(`         ${noImo.length} dropped for an unparseable IMO string`);
    console.log(`         ${multiImoItems} duplicate rows collapsed (items carrying several IMO values)`);
    console.log(`         ${imoCollisions} distinct items collided on one IMO`);
    console.log(`         ${badCheckDigit} kept IMO numbers fail the check digit`);

    // Ship names repeat heavily across the world fleet (there are many "Evora"s), so the
    // slug embeds the IMO number rather than being de-duplicated with a counter. That
    // makes it unique by construction, stable across re-runs, and unambiguous in a URL —
    // a counter-based slug would silently reassign itself when the fleet changes.
    const vesselSlugFor = (name, imo) => {
        const base = slugify(name);
        return base ? `${base}-${imo}` : `imo-${imo}`;
    };
    const vesselRows = [...byImo.values()].map((v) => {
        const operatorQid = v.operatorQid || v.ownerQid;
        const fallback = fallbackNames[v.qid];
        // A fetched label of "IMO 9929429" is Wikidata's placeholder, not a name, so it
        // must not shadow a real name recovered from another language.
        const fetched = isPlaceholderName(v.name) ? null : v.name;
        const recovered = fallback && !isPlaceholderName(fallback.name) ? cleanVesselName(fallback.name) : null;
        const name = fetched || recovered || `IMO ${v.imo}`;
        const vd = vesselDepth[v.qid] || null;
        const wp = wpVessels[v.qid] || null;
        const ib = infoboxes[v.qid] || null;
        // Wikidata first, infobox only where Wikidata is silent.
        const pick = (fromWikidata, fromInfobox) =>
            (fromWikidata !== null && fromWikidata !== undefined ? fromWikidata : (fromInfobox ?? null));
        // Events arrive as bare QIDs; only the ones we can name are worth a timeline row.
        // The name comes from the depth cache's own event-label pass first: these are
        // event TYPES ("shipwrecking", "sea trial"), which the company-side entity cache
        // has never heard of. Resolving them only through entityLabel dropped 2,388 of
        // 2,420 timelines on the floor with no error.
        const events = (vd && vd.events ? vd.events : [])
            .map((e) => ({ event: e.event || entityLabel(e.qid), year: e.year || null, qid: e.qid }))
            .filter((e) => e.event)
            .sort((a, b) => (a.year || 9999) - (b.year || 9999));
        return {
            tenant_id: TENANT,
            imo_number: v.imo,
            mmsi: v.mmsi,
            name,
            slug: vesselSlugFor(name, v.imo),
            wikidata_qid: v.qid,
            vessel_type: classifyVessel(v.typeQids, labelOf),
            /**
             * A hull whose recorded entry-into-service is still in the future has not been
             * delivered, and the table default of 'in_service' asserts that it has. It
             * surfaced on the "largest ships" ranking, where Hero of the Seas (2027) sat
             * at #5 presented as a ship in service. Small — 2 rows — and exactly the kind
             * of claim this directory is not allowed to make.
             */
            status: v.builtYear && v.builtYear > new Date().getFullYear() ? 'under_construction' : 'in_service',
            vessel_class: labelOf(v.classQid),
            flag_country: labelOf(v.flagQid),
            operator_name: pick(labelOf(v.operatorQid), ib ? ib.operator : null),
            owner_name: pick(labelOf(v.ownerQid), ib ? ib.owner : null),
            builder_name: pick(labelOf(v.builderQid), ib ? ib.builder : null),
            home_port: pick(labelOf(v.portQid), ib ? ib.homePort : null),
            call_sign: v.callSign,
            carrier_id: carrierIdByQid.get(operatorQid) || null,
            carrier_code: operatorQid || null,
            gross_tonnage: v.grossTonnage != null ? Math.round(v.grossTonnage) : null,
            year_built: v.builtYear,
            length_m: v.lengthM,
            beam_m: pick(v.beamM, ib ? ib.beamM : null),
            draft_m: pick(v.draftM, ib ? ib.draftM : null),
            service_speed_knots: v.speedKn != null && v.speedKn < 100 ? v.speedKn : null,
            net_tonnage: pick(v.netTonnage != null ? Math.round(v.netTonnage) : null, ib && ib.nt != null ? Math.round(ib.nt) : null),

            // Only a capacity actually denominated in TEU lands in the TEU column — see
            // fetch-vessel-depth. A ferry's passenger count is not cargo capacity.
            capacity_teu: pick(
                vd && vd.teu != null ? Math.round(vd.teu) : null,
                ib && ib.teu != null ? Math.round(ib.teu) : null,
            ),
            passenger_capacity: pick(
                vd && vd.passengers != null ? Math.round(vd.passengers) : null,
                ib && ib.passengers != null ? Math.round(ib.passengers) : null,
            ),
            lane_metres: vd ? vd.laneMetres ?? null : null,
            cubic_metres: vd ? vd.cubicMetres ?? null : null,
            // The raw statement, kept only where the source named its unit.
            capacity_value: vd ? vd.capacity ?? null : null,
            capacity_unit: vd && vd.capacityUnitQid ? entityLabel(vd.capacityUnitQid) : null,
            deadweight_tons: pick(
                vd && vd.dwt != null ? Math.round(vd.dwt) : null,
                ib && ib.dwt != null ? Math.round(ib.dwt) : null,
            ),
            displacement_t: vd && vd.displacement != null ? Math.round(vd.displacement) : null,
            yard_number: pick(vd ? vd.yardNumber : null, ib ? ib.yardNumber : null),
            launched_year: vd ? vd.launchedYear : null,
            designed_to_carry: vd ? entityLabel(vd.carriesQid) : null,
            events: JSON.stringify(events),

            wikipedia_title: wp ? wp.title : null,
            wikipedia_url: wp ? wp.url : null,
            summary: wp ? wp.summary : null,
            summary_fetched_at: wp ? new Date() : null,

            // A photograph we cannot attribute is not published. See creditFor.
            image_url: imageIfCredited(v.imageUrl),
            image_credit: jsonbOrNull(creditFor(v.imageUrl)),
            data_source: 'wikidata',
            source_url: `https://www.wikidata.org/wiki/${v.qid}`,
            metadata: JSON.stringify({
                imo_check_digit_valid: imoCheckDigitValid(v.imo),
                ...(!fetched && recovered ? { name_language: fallback.lang } : {}),
            }),
            last_ingested_at: new Date(),
        };
    });

    const vesselCols = [
        'tenant_id', 'imo_number', 'mmsi', 'name', 'slug', 'wikidata_qid', 'vessel_type', 'vessel_class',
        'flag_country', 'operator_name', 'owner_name', 'builder_name', 'home_port', 'call_sign',
        'carrier_id', 'carrier_code', 'status', 'gross_tonnage', 'year_built', 'length_m', 'beam_m', 'draft_m',
        'service_speed_knots', 'net_tonnage', 'capacity_teu', 'passenger_capacity', 'lane_metres',
        'cubic_metres', 'capacity_value', 'capacity_unit', 'deadweight_tons', 'displacement_t',
        'yard_number', 'launched_year', 'designed_to_carry', 'events', 'wikipedia_title',
        'wikipedia_url', 'summary', 'summary_fetched_at', 'image_url', 'image_credit',
        'data_source', 'source_url', 'metadata', 'last_ingested_at',
    ];
    // Clear previously-ingested reference vessels so the load is a true replace and a
    // slug or schema change cannot strand stale rows.
    //
    // Two exclusions matter. imo_number is globally UNIQUE, so a tenant's own operational
    // vessel and the reference record for the same ship are necessarily the SAME row —
    // the upsert enriches it and leaves its tenant_id alone. Deleting such a row would
    // cascade away that tenant's voyages and port calls. So only rows that belong to the
    // GLOBAL reference tenant and that nothing operational points at are removed.
    const [, delMeta] = await db.sequelize.query(
        `DELETE FROM tradeops.vessels v
          WHERE v.data_source = 'wikidata'
            AND v.tenant_id = $tenant
            AND NOT EXISTS (SELECT 1 FROM tradeops.voyages y WHERE y.vessel_id = v.id)`,
        { bind: { tenant: TENANT }, logging: false },
    );
    console.log(`[load] cleared ${delMeta.rowCount} previously-ingested vessels`);

    console.log(`[load] upserting ${vesselRows.length} vessels...`);
    await bulkUpsert(
        'tradeops.vessels', vesselCols, vesselRows, 'imo_number',
        vesselCols.filter((c) => c !== 'imo_number' && c !== 'tenant_id'),
    );

    console.log(`[load] done in ${Math.round((Date.now() - started) / 1000)}s`);
    return { carriers: carrierRows.length, vessels: vesselRows.length };
}

if (require.main === module) {
    main()
        // Exit explicitly. Closing the Sequelize pool is not enough to end the process —
        // something in the shared model graph keeps a handle open, and a batch script that
        // never returns hangs a cron or CI job rather than failing it.
        .then((r) => {
            console.log(`[load] PASS — ${r.carriers} carriers, ${r.vessels} vessels`);
            return db.sequelize.close().then(() => process.exit(0));
        })
        .catch((e) => {
            console.error('[load] FAIL —', e.message);
            if (e.parent) console.error('  detail:', e.parent.detail || e.parent.message);
            if (e.fields) console.error('  fields:', e.fields);
            process.exit(1);
        });
}
module.exports = { slugify, main };
