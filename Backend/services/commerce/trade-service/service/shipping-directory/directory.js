'use strict';
/**
 * Read model for the public World Shipping Directory.
 *
 * Everything here is derived from tradeops.carriers / tradeops.vessels /
 * tradeops.carrier_fleet_history, which the Wikidata + Alphaliner ingest fills. Two
 * rules run through the whole module:
 *
 *   1. The counted fleet (registry_vessel_count) and the published fleet
 *      (reported_fleet_size) are returned as SEPARATE fields, each with its own
 *      provenance, and never coalesced. They differ by 20x for the largest lines, so a
 *      COALESCE here would put a false fleet size on the page.
 *   2. Anything that is not known comes back null. There is no placeholder, no
 *      "approximately", no filled-in average — a company page renders the gaps.
 */
const db = require('../../models');

const q = async (sql, bind) => {
    const [rows] = await db.sequelize.query(sql, { bind });
    return rows;
};
const one = async (sql, bind) => (await q(sql, bind))[0] || null;

const int = (v, dflt) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : dflt;
};

const CARRIER_SORTS = {
    rank: 'c.capacity_rank ASC NULLS LAST, c.registry_vessel_count DESC',
    fleet: 'c.registry_vessel_count DESC, c.name ASC',
    reported: 'c.reported_fleet_size DESC NULLS LAST, c.name ASC',
    teu: 'c.reported_teu DESC NULLS LAST, c.name ASC',
    tonnage: 'c.registry_gt DESC NULLS LAST, c.name ASC',
    founded: 'c.founded_year ASC NULLS LAST, c.name ASC',
    name: 'c.name ASC',
};

const VESSEL_SORTS = {
    tonnage: 'v.gross_tonnage DESC NULLS LAST, v.name ASC',
    newest: 'v.year_built DESC NULLS LAST, v.name ASC',
    oldest: 'v.year_built ASC NULLS LAST, v.name ASC',
    length: 'v.length_m DESC NULLS LAST, v.name ASC',
    name: 'v.name ASC',
    imo: 'v.imo_number ASC',
};

/**
 * WHAT DESERVES TO BE IN A SEARCH INDEX.
 *
 * This started strict, because 52,364 vessel pages held no photograph, no summary, no
 * builder and no operator — roughly 40 unique words on a shared template, which is the
 * shape that gets a site classed as scaled content. Half the registry was withheld.
 *
 * The cohort context layer (migration 071 + build-context.js) changed the premise rather
 * than the policy. Every vessel page now states where that hull sits among the ships of
 * its type, flag, build year and builder, which of its peers are immediately larger and
 * smaller, and what else occupies its part of the IMO series — several hundred words that
 * differ on all 95,871 pages. A page that says something specific and true deserves to be
 * indexed, so nearly all of them now are.
 *
 * What is STILL withheld is the genuinely empty tail: a record with no tonnage, no flag,
 * no build year and no IMO number has nothing to compare and nothing to say. There is no
 * honest way to write 400 words about it, and padding it with boilerplate about vessel
 * types would be the exact duplication this layer exists to avoid. Those stay
 * noindex,FOLLOW — reachable, crawlable, linked, simply not submitted.
 *
 * One SQL expression, used by both the page's robots meta and the sitemap, so the two can
 * never disagree about which pages were offered.
 */
const VESSEL_INDEXABLE_SQL = `(
    v.gross_tonnage IS NOT NULL
 OR v.flag_country IS NOT NULL
 OR v.year_built IS NOT NULL
 OR v.imo_number IS NOT NULL
 OR v.summary IS NOT NULL
 OR v.image_url IS NOT NULL
 OR v.carrier_id IS NOT NULL
 OR v.vessel_class IS NOT NULL
 OR v.builder_name IS NOT NULL
)`;

const CARRIER_INDEXABLE_SQL = `(
    c.summary IS NOT NULL
 OR c.registry_vessel_count > 0
 OR c.reported_fleet_size IS NOT NULL
 OR jsonb_array_length(c.founders) > 0
 OR c.website IS NOT NULL
 OR c.country IS NOT NULL
 OR c.founded_year IS NOT NULL
)`;

const CARRIER_FIELDS = `
    c.id, c.slug, c.code, c.name, c.legal_name, c.description, c.website, c.logo_url,
    c.country, c.country_code, c.headquarters, c.founded_year, c.company_type,
    c.employee_count, c.parent_name, c.alliance,
    c.registry_vessel_count, c.registry_gt, c.registry_teu, c.registry_dwt,
    c.reported_fleet_size, c.reported_teu, c.market_share_pct, c.capacity_rank,
    c.reported_source, c.reported_source_url, c.reported_as_of,
    c.data_source, c.source_url, c.wikidata_qid, c.last_ingested_at,
    c.logo_credit, c.industry, c.summary IS NOT NULL AS has_summary`;

/**
 * The company profile page's field list. Kept separate from CARRIER_FIELDS because the
 * depth columns include a paragraph of prose and six JSONB arrays — pulling those for
 * every row of a 50-row index would multiply the list payload for data the list cannot
 * show anyway.
 */
const CARRIER_DETAIL_FIELDS = `
    c.id, c.slug, c.code, c.name, c.legal_name, c.description, c.website, c.logo_url,
    c.country, c.country_code, c.headquarters, c.founded_year, c.company_type,
    c.employee_count, c.parent_name, c.alliance,
    c.registry_vessel_count, c.registry_gt, c.registry_teu, c.registry_dwt,
    c.reported_fleet_size, c.reported_teu, c.market_share_pct, c.capacity_rank,
    c.reported_source, c.reported_source_url, c.reported_as_of,
    c.data_source, c.source_url, c.wikidata_qid, c.last_ingested_at,
    c.founders, c.key_people, c.subsidiaries, c.owners, c.products,
    c.industry, c.legal_form, c.formed_in, c.stock_exchange, c.ticker, c.isin, c.lei,
    c.dissolved_year, c.revenue, c.net_profit, c.operating_income, c.total_assets,
    c.total_equity, c.market_cap, c.financials_currency, c.financials_as_of,
    c.hq_lat, c.hq_lon, c.image_url, c.image_credit, c.logo_credit,
    c.wikipedia_title, c.wikipedia_url, c.summary, c.summary_fetched_at, c.social,
    c.fleet_rank_global, c.fleet_rank_in_country, c.country_carrier_count,
    ${CARRIER_INDEXABLE_SQL} AS is_indexable`;

/**
 * Company list. `scope` decides which population is being browsed:
 *   ranked      — carriers with a published capacity ranking (the Top 30 container lines)
 *   with_fleet  — carriers we actually hold vessels for
 *   commercial  — excludes navies/coast guards, which operate ships but are not companies
 *   all         — everything, including state fleets
 */
async function listCarriers(opts = {}) {
    const limit = Math.min(int(opts.limit, 50), 200);
    const offset = Math.max(int(opts.offset, 0), 0);
    const sort = CARRIER_SORTS[opts.sort] || CARRIER_SORTS.rank;

    const where = ['c.deleted_at IS NULL'];
    const bind = {};
    if (opts.search) { bind.search = `%${String(opts.search).trim()}%`; where.push('(c.name ILIKE $search OR c.legal_name ILIKE $search OR c.country ILIKE $search)'); }
    if (opts.country) { bind.country = String(opts.country).toUpperCase(); where.push('UPPER(c.country_code) = $country'); }
    if (opts.alliance) { bind.alliance = String(opts.alliance); where.push('c.alliance = $alliance'); }

    const scope = opts.scope || 'commercial';
    if (scope === 'ranked') where.push('c.capacity_rank IS NOT NULL');
    else if (scope === 'with_fleet') where.push('c.registry_vessel_count > 0');
    // 'commercial' means an actual company. Countries, cities and private individuals
    // turn up as a vessel's operator in reference data and are classified out here
    // rather than being listed as shipping companies (see classify.js).
    if (scope !== 'all') where.push("c.company_type = 'commercial'");

    const clause = where.join(' AND ');
    bind.limit = limit;
    bind.offset = offset;

    const rows = await q(
        `SELECT ${CARRIER_FIELDS} FROM tradeops.carriers c WHERE ${clause} ORDER BY ${sort} LIMIT $limit OFFSET $offset`,
        bind,
    );
    const total = await one(`SELECT COUNT(*)::int AS n FROM tradeops.carriers c WHERE ${clause}`, bind);
    return { data: rows, total: total ? total.n : 0, limit, offset, scope };
}

async function getCarrier(slug) {
    return one(`SELECT ${CARRIER_DETAIL_FIELDS} FROM tradeops.carriers c WHERE c.slug = $slug AND c.deleted_at IS NULL`, { slug });
}

/**
 * Where a company sits among its peers.
 *
 * Same purpose as getVesselContext: a company page holding a name, a country and a fleet
 * count is thin, and what makes it specific is the comparison — the Nth largest operator
 * on record, the Nth of M registered in its country, against that country's median. All
 * counts over real rows; a company with no fleet gets no fleet comparison.
 */
async function getCarrierContext(carrier) {
    if (!carrier) return null;

    const [[registry], [country], sameEra] = await Promise.all([
        q(`SELECT COUNT(*)::int AS n,
                  COUNT(*) FILTER (WHERE registry_vessel_count > 0)::int AS with_fleet,
                  percentile_cont(0.5) WITHIN GROUP (ORDER BY registry_vessel_count)
                    FILTER (WHERE registry_vessel_count > 0)::int AS median_fleet,
                  percentile_cont(0.5) WITHIN GROUP (ORDER BY founded_year)::int AS median_founded,
                  MIN(founded_year)::int AS oldest_founded
             FROM tradeops.carriers
            WHERE deleted_at IS NULL AND company_type = 'commercial'`),
        carrier.country_code
            ? q(`SELECT COUNT(*)::int AS n,
                        SUM(registry_vessel_count)::int AS fleet,
                        percentile_cont(0.5) WITHIN GROUP (ORDER BY founded_year)::int AS median_founded,
                        COUNT(*) FILTER (WHERE capacity_rank IS NOT NULL)::int AS ranked
                   FROM tradeops.carriers
                  WHERE deleted_at IS NULL AND company_type = 'commercial'
                    AND UPPER(country_code) = UPPER($code)`, { code: carrier.country_code })
            : Promise.resolve([null]),
        // Operators founded within a decade of this one — a genuinely different set per page.
        carrier.founded_year
            ? q(`SELECT COUNT(*)::int AS n,
                        percentile_cont(0.5) WITHIN GROUP (ORDER BY registry_vessel_count)::int AS median_fleet
                   FROM tradeops.carriers
                  WHERE deleted_at IS NULL AND company_type = 'commercial'
                    AND founded_year BETWEEN $from AND $to`,
                 { from: carrier.founded_year - 5, to: carrier.founded_year + 5 })
            : Promise.resolve([null]),
    ]);

    return { registry, country: country || null, sameEra: (sameEra && sameEra[0]) || null };
}

/**
 * Which of a company's related entities we hold a page for.
 *
 * The parent/subsidiary/owner arrays are Wikidata QIDs with names, and most of them are
 * ports, terminals or holding companies this directory has never heard of. But some are
 * carriers in their own right, and those are exactly the links a reader needs: the
 * A.P. Moller-Maersk group page shows 9 ships and no capacity ranking, because the
 * ranked container line is a SEPARATE entity (Maersk A/S) sitting in its subsidiary
 * list. Without this the group page is a dead end that looks like missing data.
 *
 * Resolved live against carriers rather than baked into the ingest so a company that
 * gains a page later starts linking without a re-ingest.
 */
async function resolveRelatedCarriers(qids) {
    const unique = [...new Set((qids || []).filter((q) => /^Q\d+$/.test(q)))];
    if (!unique.length) return {};
    const rows = await q(
        `SELECT wikidata_qid, slug, name, capacity_rank, registry_vessel_count, reported_fleet_size
           FROM tradeops.carriers
          WHERE wikidata_qid = ANY($qids) AND slug IS NOT NULL AND deleted_at IS NULL`,
        { qids: unique },
    );
    const out = {};
    for (const r of rows) out[r.wikidata_qid] = r;
    return out;
}

/**
 * Other operators registered in the same country. A directory page that dead-ends is a
 * page a crawler visits once; this is the lateral link that makes the country dimension
 * traversable without inventing a relationship the data does not support.
 */
async function listPeerCarriers(carrierId, countryCode, limit = 8) {
    if (!countryCode) return [];
    return q(
        `SELECT c.slug, c.name, c.country, c.registry_vessel_count, c.reported_fleet_size,
                c.capacity_rank, c.founded_year, c.logo_url
           FROM tradeops.carriers c
          WHERE UPPER(c.country_code) = UPPER($code) AND c.id <> $id
            AND c.company_type = 'commercial' AND c.deleted_at IS NULL
          ORDER BY c.capacity_rank ASC NULLS LAST, c.registry_vessel_count DESC
          LIMIT $limit`,
        { code: countryCode, id: carrierId, limit },
    );
}

/** Everything the company page shows about the fleet we can actually verify. */
async function getCarrierFleetProfile(carrierId) {
    const [summary, byType, byFlag, byDecade, builders, largest, newest, history] = await Promise.all([
        one(
            `SELECT COUNT(*)::int                          AS vessels,
                    COUNT(year_built)::int                 AS with_year,
                    COUNT(gross_tonnage)::int              AS with_tonnage,
                    SUM(gross_tonnage)::bigint             AS total_gt,
                    ROUND(AVG(gross_tonnage))::int         AS avg_gt,
                    MAX(gross_tonnage)::int                AS max_gt,
                    MIN(year_built)::int                   AS oldest_year,
                    MAX(year_built)::int                   AS newest_year,
                    ROUND(AVG(EXTRACT(YEAR FROM now()) - year_built), 1) AS avg_age_years,
                    COUNT(DISTINCT flag_country)::int      AS flag_states,
                    COUNT(DISTINCT vessel_type)::int       AS vessel_types
             FROM tradeops.vessels WHERE carrier_id = $id`,
            { id: carrierId },
        ),
        q(`SELECT vessel_type, COUNT(*)::int AS n, SUM(gross_tonnage)::bigint AS gt
            FROM tradeops.vessels WHERE carrier_id = $id
            GROUP BY vessel_type ORDER BY n DESC`, { id: carrierId }),
        q(`SELECT flag_country, COUNT(*)::int AS n FROM tradeops.vessels
            WHERE carrier_id = $id AND flag_country IS NOT NULL
            GROUP BY flag_country ORDER BY n DESC LIMIT 15`, { id: carrierId }),
        q(`SELECT (year_built / 10) * 10 AS decade, COUNT(*)::int AS n FROM tradeops.vessels
            WHERE carrier_id = $id AND year_built IS NOT NULL
            GROUP BY 1 ORDER BY 1`, { id: carrierId }),
        q(`SELECT builder_name, COUNT(*)::int AS n FROM tradeops.vessels
            WHERE carrier_id = $id AND builder_name IS NOT NULL
            GROUP BY builder_name ORDER BY n DESC LIMIT 10`, { id: carrierId }),
        q(`SELECT slug, name, imo_number, vessel_type, gross_tonnage, year_built, length_m, flag_country, image_url
            FROM tradeops.vessels WHERE carrier_id = $id AND gross_tonnage IS NOT NULL
            ORDER BY gross_tonnage DESC LIMIT 10`, { id: carrierId }),
        q(`SELECT slug, name, imo_number, vessel_type, gross_tonnage, year_built, flag_country, image_url
            FROM tradeops.vessels WHERE carrier_id = $id AND year_built IS NOT NULL
            ORDER BY year_built DESC LIMIT 10`, { id: carrierId }),
        q(`SELECT year, basis, vessels_delivered, cumulative_vessels, teu_delivered, cumulative_teu, gt_delivered
            FROM tradeops.carrier_fleet_history WHERE carrier_id = $id
            ORDER BY year ASC`, { id: carrierId }),
    ]);
    return { summary, byType, byFlag, byDecade, builders, largest, newest, history };
}

async function listCarrierVessels(carrierId, opts = {}) {
    const limit = Math.min(int(opts.limit, 50), 200);
    const offset = Math.max(int(opts.offset, 0), 0);
    const sort = VESSEL_SORTS[opts.sort] || VESSEL_SORTS.tonnage;
    const where = ['v.carrier_id = $id'];
    const bind = { id: carrierId, limit, offset };
    if (opts.type) { bind.type = opts.type; where.push('v.vessel_type = $type'); }
    if (opts.search) { bind.search = `%${String(opts.search).trim()}%`; where.push('(v.name ILIKE $search OR v.imo_number ILIKE $search)'); }
    const clause = where.join(' AND ');

    const data = await q(
        `SELECT v.slug, v.name, v.imo_number, v.mmsi, v.vessel_type, v.vessel_class, v.flag_country,
                v.gross_tonnage, v.year_built, v.length_m, v.beam_m, v.builder_name, v.home_port,
                v.call_sign, v.image_url, v.image_credit, v.capacity_teu, v.deadweight_tons,
                v.source_url
         FROM tradeops.vessels v WHERE ${clause} ORDER BY ${sort} LIMIT $limit OFFSET $offset`,
        bind,
    );
    const total = await one(`SELECT COUNT(*)::int AS n FROM tradeops.vessels v WHERE ${clause}`, bind);
    return { data, total: total ? total.n : 0, limit, offset };
}

async function listVessels(opts = {}) {
    const limit = Math.min(int(opts.limit, 50), 200);
    const offset = Math.max(int(opts.offset, 0), 0);
    const sort = VESSEL_SORTS[opts.sort] || VESSEL_SORTS.tonnage;
    const where = ['1 = 1'];
    const bind = { limit, offset };
    if (opts.search) { bind.search = `%${String(opts.search).trim()}%`; where.push('(v.name ILIKE $search OR v.imo_number ILIKE $search OR v.call_sign ILIKE $search)'); }
    if (opts.type) { bind.type = opts.type; where.push('v.vessel_type = $type'); }
    if (opts.flag) { bind.flag = opts.flag; where.push('v.flag_country = $flag'); }
    if (opts.builtFrom) { bind.builtFrom = int(opts.builtFrom, 0); where.push('v.year_built >= $builtFrom'); }
    if (opts.builtTo) { bind.builtTo = int(opts.builtTo, 9999); where.push('v.year_built <= $builtTo'); }
    if (opts.carrierSlug) { bind.carrierSlug = opts.carrierSlug; where.push('c.slug = $carrierSlug'); }
    const clause = where.join(' AND ');

    const data = await q(
        `SELECT v.slug, v.name, v.imo_number, v.vessel_type, v.flag_country, v.gross_tonnage,
                v.year_built, v.length_m, v.image_url, v.image_credit, v.capacity_teu,
                v.deadweight_tons, v.status, v.operator_name, v.owner_name,
                c.slug AS carrier_slug, c.name AS carrier_name
         FROM tradeops.vessels v
         LEFT JOIN tradeops.carriers c ON c.id = v.carrier_id
         WHERE ${clause} ORDER BY ${sort} LIMIT $limit OFFSET $offset`,
        bind,
    );
    const total = await one(
        `SELECT COUNT(*)::int AS n FROM tradeops.vessels v
         LEFT JOIN tradeops.carriers c ON c.id = v.carrier_id WHERE ${clause}`, bind,
    );
    return { data, total: total ? total.n : 0, limit, offset };
}

/**
 * One ship, with its rank among ships we hold. Rank is computed live rather than stored
 * so it can never disagree with the registry, and it is explicitly scoped: "N-th largest
 * of the M ships in this registry that report a tonnage", not "N-th largest afloat".
 */
async function getVessel(slug) {
    const vessel = await one(
        `SELECT v.*, ${VESSEL_INDEXABLE_SQL} AS is_indexable,
                c.slug AS carrier_slug, c.name AS carrier_name, c.country AS carrier_country,
                c.capacity_rank AS carrier_capacity_rank,
                bs.slug AS builder_slug, fs.slug AS flag_slug
         FROM tradeops.vessels v
         LEFT JOIN tradeops.carriers c ON c.id = v.carrier_id
         LEFT JOIN tradeops.vessel_cohort_stats bs
                ON bs.dimension = 'builder' AND bs.cohort_key = v.builder_name
         LEFT JOIN tradeops.vessel_cohort_stats fs
                ON fs.dimension = 'flag'    AND fs.cohort_key = v.flag_country
         WHERE v.slug = $slug`,
        { slug },
    );
    if (!vessel) return null;

    const ranks = await one(
        `SELECT
            (SELECT COUNT(*)::int + 1 FROM tradeops.vessels x
              WHERE x.gross_tonnage > $gt)                                    AS gt_rank_global,
            (SELECT COUNT(*)::int FROM tradeops.vessels x
              WHERE x.gross_tonnage IS NOT NULL)                              AS gt_ranked_total,
            (SELECT COUNT(*)::int + 1 FROM tradeops.vessels x
              WHERE x.vessel_type = $type AND x.gross_tonnage > $gt)          AS gt_rank_in_type,
            (SELECT COUNT(*)::int FROM tradeops.vessels x
              WHERE x.vessel_type = $type AND x.gross_tonnage IS NOT NULL)    AS type_ranked_total,
            (SELECT COUNT(*)::int + 1 FROM tradeops.vessels x
              WHERE x.carrier_id = $carrierId AND x.gross_tonnage > $gt)      AS gt_rank_in_fleet,
            (SELECT COUNT(*)::int FROM tradeops.vessels x
              WHERE x.carrier_id = $carrierId AND x.gross_tonnage IS NOT NULL) AS fleet_ranked_total`,
        { gt: vessel.gross_tonnage, type: vessel.vessel_type, carrierId: vessel.carrier_id },
    );

    const sisters = vessel.vessel_class
        ? await q(
            `SELECT slug, name, imo_number, year_built, gross_tonnage, flag_country, vessel_type, image_url
               FROM tradeops.vessels
              WHERE vessel_class = $cls AND slug <> $slug ORDER BY year_built NULLS LAST LIMIT 12`,
            { cls: vessel.vessel_class, slug },
        )
        : [];

    /**
     * Ships from the same yard in the same year. NOT presented as sisters — they are not
     * necessarily of one class, and calling them that would assert a relationship the
     * data does not contain. Shown only where a real class is unknown, and labelled as
     * what it is: contemporaries from the same builder.
     */
    const yardMates = !vessel.vessel_class && vessel.builder_name && vessel.year_built
        ? await q(
            `SELECT slug, name, imo_number, year_built, gross_tonnage, flag_country, vessel_type, image_url
               FROM tradeops.vessels
              WHERE builder_name = $builder AND year_built BETWEEN $from AND $to AND slug <> $slug
              ORDER BY gross_tonnage DESC NULLS LAST LIMIT 8`,
            { builder: vessel.builder_name, from: vessel.year_built - 1, to: vessel.year_built + 1, slug },
        )
        : [];

    /** Other ships in the same fleet, so a ship page leads somewhere. */
    const fleetMates = vessel.carrier_id
        ? await q(
            `SELECT slug, name, imo_number, year_built, gross_tonnage, vessel_type, flag_country, image_url
               FROM tradeops.vessels WHERE carrier_id = $cid AND slug <> $slug
              ORDER BY gross_tonnage DESC NULLS LAST LIMIT 6`,
            { cid: vessel.carrier_id, slug },
        )
        : [];

    const context = await getVesselContext(vessel);

    return { vessel, ranks: vessel.gross_tonnage != null ? ranks : null, sisters, yardMates, fleetMates, context };
}

/** Directory-wide totals — every one of these is a COUNT over real rows. */
async function getStats() {
    const [totals, byType, byFlag, byDecade, topCountries, topBuilders] = await Promise.all([
        one(`SELECT
                (SELECT COUNT(*)::int FROM tradeops.carriers WHERE deleted_at IS NULL)                       AS companies,
                (SELECT COUNT(*)::int FROM tradeops.carriers WHERE company_type = 'commercial' AND deleted_at IS NULL) AS commercial_companies,
                (SELECT COUNT(*)::int FROM tradeops.carriers WHERE company_type = 'state' AND deleted_at IS NULL) AS state_fleets,
                (SELECT COUNT(*)::int FROM tradeops.carriers WHERE summary IS NOT NULL)                      AS companies_with_summary,
                (SELECT COUNT(*)::int FROM tradeops.carriers WHERE jsonb_array_length(founders) > 0)         AS companies_with_founder,
                (SELECT COUNT(*)::int FROM tradeops.vessels  WHERE image_url IS NOT NULL)                    AS vessels_with_photo,
                (SELECT COUNT(*)::int FROM tradeops.carriers WHERE registry_vessel_count > 0)                AS companies_with_fleet,
                (SELECT COUNT(*)::int FROM tradeops.carriers WHERE reported_fleet_size IS NOT NULL)          AS companies_with_reported_fleet,
                (SELECT COUNT(*)::int FROM tradeops.vessels)                                                 AS vessels,
                (SELECT COUNT(*)::int FROM tradeops.vessels WHERE carrier_id IS NOT NULL)                    AS vessels_with_operator,
                (SELECT COUNT(*)::int FROM tradeops.vessels WHERE imo_number IS NOT NULL)                    AS vessels_with_imo,
                (SELECT COUNT(DISTINCT flag_country)::int FROM tradeops.vessels WHERE flag_country IS NOT NULL) AS flag_states,
                (SELECT COUNT(DISTINCT country)::int FROM tradeops.carriers WHERE country IS NOT NULL)       AS company_countries,
                (SELECT SUM(gross_tonnage)::bigint FROM tradeops.vessels)                                    AS total_gross_tonnage,
                (SELECT MAX(last_ingested_at) FROM tradeops.vessels)                                         AS last_ingested_at`),
        q(`SELECT vessel_type, COUNT(*)::int AS n FROM tradeops.vessels GROUP BY vessel_type ORDER BY n DESC`),
        q(`SELECT flag_country, COUNT(*)::int AS n FROM tradeops.vessels
            WHERE flag_country IS NOT NULL GROUP BY flag_country ORDER BY n DESC LIMIT 20`),
        q(`SELECT (year_built / 10) * 10 AS decade, COUNT(*)::int AS n FROM tradeops.vessels
            WHERE year_built IS NOT NULL GROUP BY 1 ORDER BY 1`),
        q(`SELECT country, country_code, COUNT(*)::int AS n FROM tradeops.carriers
            WHERE country IS NOT NULL AND company_type = 'commercial' AND deleted_at IS NULL
            GROUP BY country, country_code ORDER BY n DESC LIMIT 25`),
        q(`SELECT builder_name, COUNT(*)::int AS n, SUM(gross_tonnage)::bigint AS gt
            FROM tradeops.vessels WHERE builder_name IS NOT NULL
            GROUP BY builder_name ORDER BY n DESC LIMIT 20`),
    ]);
    return { totals, byType, byFlag, byDecade, topCountries, topBuilders };
}

/** The published container-capacity ranking, returned with its citation attached. */
async function getRankings() {
    const data = await q(
        `SELECT ${CARRIER_FIELDS} FROM tradeops.carriers c
         WHERE c.capacity_rank IS NOT NULL AND c.deleted_at IS NULL
         ORDER BY c.capacity_rank ASC`,
    );
    const provenance = data.length
        ? { source: data[0].reported_source, sourceUrl: data[0].reported_source_url, asOf: data[0].reported_as_of }
        : null;
    return { data, provenance };
}

async function listCountries() {
    return q(`SELECT country, country_code, COUNT(*)::int AS companies,
                     SUM(registry_vessel_count)::int AS registry_vessels
              FROM tradeops.carriers
              WHERE country IS NOT NULL AND deleted_at IS NULL AND company_type <> 'state'
              GROUP BY country, country_code ORDER BY companies DESC`);
}

/**
 * The cohorts a vessel page compares itself against, plus its nearest neighbours by size.
 *
 * One indexed lookup over the precomputed stats rather than the ~400ms aggregate it
 * replaces (see scripts/shipping-directory/build-context.js). The neighbours are two
 * small indexed reads: they are what turns "larger than 78% of its type" into something a
 * reader can check — the named ships immediately above and below this one.
 */
async function getVesselContext(vessel) {
    if (!vessel) return null;
    const decade = vessel.year_built != null ? String(Math.floor(vessel.year_built / 10) * 10) : null;

    const rows = await q(
        `SELECT * FROM tradeops.vessel_cohort_stats
          WHERE (dimension = 'global'  AND cohort_key = 'all')
             OR (dimension = 'type'    AND cohort_key = $type)
             OR (dimension = 'flag'    AND cohort_key = $flag)
             OR (dimension = 'year'    AND cohort_key = $year)
             OR (dimension = 'builder' AND cohort_key = $builder)
             OR (dimension = 'decade'  AND cohort_key = $decade)`,
        {
            type: vessel.vessel_type ?? '',
            flag: vessel.flag_country ?? '',
            year: vessel.year_built != null ? String(vessel.year_built) : '',
            builder: vessel.builder_name ?? '',
            decade: decade ?? '',
        },
    );

    const cohorts = {};
    for (const r of rows) cohorts[r.dimension] = r;

    /**
     * How many hulls share BOTH this ship's flag and its type.
     *
     * A cross-cut rather than another single dimension, because "one of 9,598 Panamanian
     * ships" and "one of 6,890 bulk carriers" are both true of thousands of pages, while
     * "one of 412 Panamanian-flagged bulk carriers" narrows to something that reads as
     * specific. Two indexed counts, cheap enough to do per request.
     */
    let crossFlagType = null;
    if (vessel.flag_country && vessel.vessel_type) {
        const [[row]] = [await q(
            `SELECT COUNT(*)::int AS n,
                    COUNT(*) FILTER (WHERE gross_tonnage > $gt)::int AS larger
               FROM tradeops.vessels
              WHERE flag_country = $flag AND vessel_type = $type`,
            { flag: vessel.flag_country, type: vessel.vessel_type, gt: vessel.gross_tonnage ?? -1 },
        )];
        crossFlagType = row || null;
    }

    // The ships either side of this one by tonnage, within its own type. Only meaningful
    // where a tonnage exists — a hull with no measurement has no neighbours.
    let neighbours = { larger: [], smaller: [] };
    if (vessel.gross_tonnage != null) {
        const [larger, smaller] = await Promise.all([
            q(`SELECT slug, name, imo_number, gross_tonnage, year_built, flag_country
                 FROM tradeops.vessels
                WHERE vessel_type = $type AND gross_tonnage > $gt AND id <> $id
                ORDER BY gross_tonnage ASC LIMIT 3`,
              { type: vessel.vessel_type, gt: vessel.gross_tonnage, id: vessel.id }),
            q(`SELECT slug, name, imo_number, gross_tonnage, year_built, flag_country
                 FROM tradeops.vessels
                WHERE vessel_type = $type AND gross_tonnage < $gt AND id <> $id
                ORDER BY gross_tonnage DESC LIMIT 3`,
              { type: vessel.vessel_type, gt: vessel.gross_tonnage, id: vessel.id }),
        ]);
        neighbours = { larger: larger.reverse(), smaller };
    }

    /**
     * The neighbourhood of this hull's IMO number in the series.
     *
     * IMO numbers are issued in broadly chronological blocks, so the ships holding
     * adjacent numbers were registered around the same time. For the 1,800 hulls in this
     * registry that carry a name and an IMO number and nothing else, this is the only
     * genuinely per-record thing that can be said — and it is a real count over real rows,
     * not an inference about THIS ship. The page states it as what it is: what else sits
     * in that part of the series.
     *
     * IMO numbers are fixed-width 7-digit strings, so a text BETWEEN sorts identically to
     * a numeric one and needs no cast that a malformed value could break.
     */
    let imoSeries = null;
    if (vessel.imo_number && /^\d{7}$/.test(vessel.imo_number)) {
        const n = Number(vessel.imo_number);
        const lo = String(Math.max(1000000, n - 500)).padStart(7, '0');
        const hi = String(Math.min(9999999, n + 500)).padStart(7, '0');
        const [[summary], adjacent] = await Promise.all([
            q(`SELECT COUNT(*)::int AS n,
                      COUNT(year_built)::int AS with_year,
                      percentile_cont(0.5) WITHIN GROUP (ORDER BY year_built)::int AS median_year,
                      MIN(year_built)::int AS oldest, MAX(year_built)::int AS newest
                 FROM tradeops.vessels
                WHERE imo_number BETWEEN $lo AND $hi`, { lo, hi }),
            q(`SELECT slug, name, imo_number, year_built, gross_tonnage, flag_country, vessel_type
                 FROM tradeops.vessels
                WHERE imo_number BETWEEN $lo AND $hi AND imo_number <> $imo
                ORDER BY ABS(imo_number::bigint - $n) ASC LIMIT 4`,
              { lo, hi, imo: vessel.imo_number, n }),
        ]);
        imoSeries = { window: 500, ...summary, adjacent };
    }

    return { cohorts, neighbours, crossFlagType, imoSeries };
}

/**
 * One country's shipping sector: its operators, and the fleet they hold between them.
 *
 * Matched on country_code rather than the country name so that "Korea, Republic of" and
 * "South Korea" cannot become two pages competing for the same query.
 */
async function getCountry(code) {
    const upper = String(code || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(upper)) return null;

    const [summary, companies, fleetByType, topShips] = await Promise.all([
        one(`SELECT MIN(country) AS country, UPPER($code) AS country_code,
                    COUNT(*)::int AS companies,
                    COUNT(*) FILTER (WHERE capacity_rank IS NOT NULL)::int AS ranked_companies,
                    SUM(registry_vessel_count)::int AS registry_vessels,
                    SUM(reported_fleet_size)::int   AS reported_vessels,
                    SUM(reported_teu)::bigint       AS reported_teu,
                    MIN(founded_year)::int          AS oldest_founded
               FROM tradeops.carriers
              WHERE UPPER(country_code) = UPPER($code)
                AND company_type = 'commercial' AND deleted_at IS NULL`, { code: upper }),
        q(`SELECT c.slug, c.name, c.headquarters, c.founded_year, c.registry_vessel_count,
                  c.reported_fleet_size, c.reported_teu, c.capacity_rank, c.logo_url, c.industry
             FROM tradeops.carriers c
            WHERE UPPER(c.country_code) = UPPER($code)
              AND c.company_type = 'commercial' AND c.deleted_at IS NULL
            ORDER BY c.capacity_rank ASC NULLS LAST, c.registry_vessel_count DESC, c.name ASC`, { code: upper }),
        q(`SELECT v.vessel_type, COUNT(*)::int AS n
             FROM tradeops.vessels v JOIN tradeops.carriers c ON c.id = v.carrier_id
            WHERE UPPER(c.country_code) = UPPER($code)
            GROUP BY v.vessel_type ORDER BY n DESC`, { code: upper }),
        q(`SELECT v.slug, v.name, v.imo_number, v.vessel_type, v.gross_tonnage, v.year_built,
                  v.flag_country, v.image_url, c.slug AS carrier_slug, c.name AS carrier_name
             FROM tradeops.vessels v JOIN tradeops.carriers c ON c.id = v.carrier_id
            WHERE UPPER(c.country_code) = UPPER($code) AND v.gross_tonnage IS NOT NULL
            ORDER BY v.gross_tonnage DESC LIMIT 10`, { code: upper }),
    ]);

    if (!summary || !summary.companies) return null;
    return { summary, companies, fleetByType, topShips };
}

/**
 * The cohort hub pages — one shipbuilder, or one flag state.
 *
 * build-context.js already computes the statistics for 1,165 yards and 212 registries;
 * these were reachable only as `/ships?q=Hyundai` and `/ships?flag=Panama`, which are
 * filtered search views carrying noindex. This turns each into an addressable page with
 * genuine list intent behind it.
 *
 * `dimension` is validated against a fixed set by the caller — it selects a query.
 */
const COHORT_VESSEL_SORTS = {
    tonnage: 'v.gross_tonnage DESC NULLS LAST, v.name ASC',
    newest: 'v.year_built DESC NULLS LAST, v.name ASC',
    oldest: 'v.year_built ASC NULLS LAST, v.name ASC',
    name: 'v.name ASC',
};

const CROSS_SEP = '::';

async function getCohort(dimension, slug, opts = {}) {
    if (dimension !== 'builder' && dimension !== 'flag' && dimension !== 'flag_type') return null;

    const cohort = await one(
        'SELECT * FROM tradeops.vessel_cohort_stats WHERE dimension = $dimension AND slug = $slug',
        { dimension, slug },
    );
    if (!cohort) return null;

    const limit = Math.min(int(opts.limit, 60), 200);
    const offset = Math.max(int(opts.offset, 0), 0);
    const sort = COHORT_VESSEL_SORTS[opts.sort] || COHORT_VESSEL_SORTS.tonnage;

    /**
     * The flag x type cross-cut filters on two columns, so it cannot share the
     * single-column WHERE the other dimensions use. Its cohort_key packs both values.
     */
    const isCross = dimension === 'flag_type';
    const column = dimension === 'builder' ? 'builder_name' : 'flag_country';
    const crossFlag = isCross ? cohort.cohort_key.split(CROSS_SEP)[0] : null;
    const crossType = isCross ? cohort.cohort_key.split(CROSS_SEP)[1] : null;
    const where = isCross
        ? 'v.flag_country = $key AND v.vessel_type = $type'
        : `v.${column} = $key`;
    const whereBare = isCross
        ? 'flag_country = $key AND vessel_type = $type'
        : `${column} = $key`;
    const key = isCross ? crossFlag : cohort.cohort_key;
    const bindExtra = isCross ? { type: crossType } : {};

    const [vessels, total, byType, topOperators] = await Promise.all([
        q(`SELECT v.slug, v.name, v.imo_number, v.vessel_type, v.flag_country, v.gross_tonnage,
                  v.deadweight_tons, v.year_built, v.length_m, v.image_url, v.builder_name,
                  c.slug AS carrier_slug, c.name AS carrier_name
             FROM tradeops.vessels v
             LEFT JOIN tradeops.carriers c ON c.id = v.carrier_id
            WHERE ${where}
            ORDER BY ${sort} LIMIT $limit OFFSET $offset`,
          { key, limit, offset, ...bindExtra }),
        one(`SELECT COUNT(*)::int AS n FROM tradeops.vessels WHERE ${whereBare}`, { key, ...bindExtra }),
        // For the cross-cut the type is fixed, so the useful breakdown is by builder.
        isCross
            // The builder slug comes from the cohort table so the sidebar links land on a
            // real hub; slugifying the name here would miss collision suffixes.
            ? q(`SELECT v.builder_name AS vessel_type, COUNT(*)::int AS n, MIN(b.slug) AS slug
                   FROM tradeops.vessels v
                   LEFT JOIN tradeops.vessel_cohort_stats b
                          ON b.dimension = 'builder' AND b.cohort_key = v.builder_name
                  WHERE ${whereBare.replace(/\b(flag_country|vessel_type)\b/g, 'v.$1')} AND v.builder_name IS NOT NULL
                  GROUP BY v.builder_name ORDER BY n DESC LIMIT 12`, { key, ...bindExtra })
            : q(`SELECT vessel_type, COUNT(*)::int AS n FROM tradeops.vessels
                  WHERE ${whereBare} GROUP BY vessel_type ORDER BY n DESC`, { key }),
        q(`SELECT c.slug, c.name, COUNT(*)::int AS n
             FROM tradeops.vessels v JOIN tradeops.carriers c ON c.id = v.carrier_id
            WHERE ${where}
            GROUP BY c.slug, c.name ORDER BY n DESC LIMIT 10`, { key, ...bindExtra }),
    ]);

    // Where this cohort sits among its peers — the same comparative treatment the vessel
    // pages get, so a yard page says "the 4th most prolific of 1,165" rather than a bare
    // count with nothing to read it against.
    const rank = await one(
        `SELECT COUNT(*)::int + 1 AS rank,
                (SELECT COUNT(*)::int FROM tradeops.vessel_cohort_stats WHERE dimension = $dimension) AS peers
           FROM tradeops.vessel_cohort_stats
          WHERE dimension = $dimension AND n > $n`,
        { dimension, n: cohort.n },
    );

    return {
        cohort: isCross ? { ...cohort, flag: crossFlag, vesselType: crossType } : cohort,
        rank,
        vessels: { data: vessels, total: total ? total.n : 0, limit, offset },
        byType,
        topOperators,
    };
}

/** Index of every builder or flag state, largest first. */
async function listCohorts(dimension) {
    if (dimension !== 'builder' && dimension !== 'flag' && dimension !== 'flag_type') return [];
    return q(
        `SELECT slug, cohort_key, n, with_gt, median_gt, max_gt, oldest_year, newest_year,
                top_type, top_type_n
           FROM tradeops.vessel_cohort_stats
          WHERE dimension = $dimension AND slug IS NOT NULL
          ORDER BY n DESC`,
        { dimension },
    );
}

/**
 * Slug + last-modified for every indexable page, streamed for the sitemap.
 *
 * The directory has ~96k vessel URLs, well past the 50,000-per-file sitemap limit, so the
 * route that consumes this chunks it. Returned as a bare projection rather than through
 * listVessels() because a sitemap needs no joins and no ordering beyond a stable one.
 */
async function listSitemapEntries(kind, { limit = 50000, offset = 0 } = {}) {
    if (kind === 'companies') {
        return q(`SELECT c.slug, GREATEST(c.updated_at, c.last_ingested_at) AS lastmod
                    FROM tradeops.carriers c
                   WHERE c.slug IS NOT NULL AND c.deleted_at IS NULL AND ${CARRIER_INDEXABLE_SQL}
                   ORDER BY c.capacity_rank ASC NULLS LAST, c.registry_vessel_count DESC, c.slug ASC
                   LIMIT $limit OFFSET $offset`, { limit, offset });
    }
    if (kind === 'vessels') {
        return q(`SELECT v.slug, GREATEST(v.updated_at, v.last_ingested_at) AS lastmod
                    FROM tradeops.vessels v
                   WHERE v.slug IS NOT NULL AND ${VESSEL_INDEXABLE_SQL}
                   ORDER BY v.gross_tonnage DESC NULLS LAST, v.slug ASC
                   LIMIT $limit OFFSET $offset`, { limit, offset });
    }
    return [];
}

async function countSitemapEntries(kind) {
    const row = kind === 'companies'
        ? await one(`SELECT COUNT(*)::int AS n FROM tradeops.carriers c
                      WHERE c.slug IS NOT NULL AND c.deleted_at IS NULL AND ${CARRIER_INDEXABLE_SQL}`)
        : await one(`SELECT COUNT(*)::int AS n FROM tradeops.vessels v
                      WHERE v.slug IS NOT NULL AND ${VESSEL_INDEXABLE_SQL}`);
    return row ? row.n : 0;
}

module.exports = {
    listCarriers, getCarrier, getCarrierFleetProfile, listCarrierVessels, listPeerCarriers,
    resolveRelatedCarriers,
    listVessels, getVessel, getStats, getRankings, listCountries, getCountry,
    listSitemapEntries, countSitemapEntries, getVesselContext, getCarrierContext,
    getCohort, listCohorts,
    CARRIER_SORTS, VESSEL_SORTS,
};
