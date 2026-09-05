'use strict';
/**
 * Stage H — cohort context, so every vessel and company page has something true and
 * specific to say about the record it describes.
 *
 * THE PROBLEM THIS SOLVES. 52,364 of the 95,871 vessel pages hold no photograph, no
 * summary, no builder and no operator. The page is a name, an IMO number and a flag on
 * the same template as every other — around 40 unique words. Search engines do not index
 * pages like that, and 52,000 of them is precisely the shape that gets a site classed as
 * scaled content.
 *
 * THE FIX IS NOT MORE WORDS, IT IS MORE DIFFERENT WORDS. Padding every page with the same
 * 900 words about what a chemical tanker is would make the duplication worse, not better:
 * boilerplate repeated across 8,000 pages contributes nothing to any of them. What IS
 * different on all 95,871 pages is where that hull sits among its peers — larger than 78%
 * of its type, the 12th largest of the 340 ships flying its flag, one of 1,868 delivered
 * that year. Those facts already exist implicitly in the registry; this stage makes them
 * explicit so the page can state them.
 *
 * EVERY VALUE HERE IS A COUNT, A RANK OR A PERCENTILE OVER ROWS ACTUALLY HELD. Nothing is
 * estimated, inferred or generated. A vessel with no recorded tonnage gets NULL ranks and
 * its page says the measurement is missing rather than placing it somewhere plausible.
 *
 * Precomputed rather than derived at render time: the cohort aggregate is a ~400ms
 * sequential scan, which is fine once per ingest and not fine once per page view.
 *
 *   node scripts/shipping-directory/build-context.js
 */
const db = require('../../models');

const q = (sql, bind) => db.sequelize.query(sql, { bind, logging: false });

/**
 * Cohort slugs, so builders and flag states get addressable pages rather than existing
 * only as a query string on the search view.
 *
 * Collisions are resolved by suffixing the runner-up, deterministically by cohort key, so
 * a URL cannot silently change owner between ingests — two yards genuinely do slugify to
 * the same string ("Hyundai Heavy Industries" vs "Hyundai heavy industries").
 */
function slugify(s) {
    return String(s || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || null;
}

async function buildCohortSlugs() {
    const [rows] = await q(
        `SELECT dimension, cohort_key FROM tradeops.vessel_cohort_stats
          WHERE dimension IN ('builder', 'flag') ORDER BY dimension, cohort_key`,
    );
    const taken = new Set();
    const updates = [];
    for (const r of rows) {
        const base = slugify(r.cohort_key);
        if (!base) continue;
        let slug = base;
        let n = 2;
        while (taken.has(`${r.dimension}:${slug}`)) { slug = `${base}-${n}`; n += 1; }
        taken.add(`${r.dimension}:${slug}`);
        updates.push({ dimension: r.dimension, cohort_key: r.cohort_key, slug });
    }
    for (let i = 0; i < updates.length; i += 500) {
        await q(`
            UPDATE tradeops.vessel_cohort_stats s
               SET slug = u.slug
              FROM (SELECT * FROM jsonb_to_recordset($rows::jsonb)
                          AS x(dimension text, cohort_key text, slug text)) u
             WHERE s.dimension = u.dimension AND s.cohort_key = u.cohort_key`,
            { rows: JSON.stringify(updates.slice(i, i + 500)) });
    }
    return updates.length;
}

/**
 * Per-vessel position among its peers, in one pass.
 *
 * `rank()` rather than `row_number()`: two ships of identical tonnage genuinely share a
 * position, and row_number would award one of them an arbitrary advantage that the page
 * would then state as fact.
 */
async function buildVesselRanks() {
    const [, meta] = await q(`
        WITH ranked AS (
            SELECT id,
                   rank() OVER (ORDER BY gross_tonnage DESC)                                    AS r_global,
                   rank() OVER (PARTITION BY vessel_type   ORDER BY gross_tonnage DESC)         AS r_type,
                   rank() OVER (PARTITION BY flag_country  ORDER BY gross_tonnage DESC)         AS r_flag,
                   rank() OVER (PARTITION BY year_built    ORDER BY gross_tonnage DESC)         AS r_year,
                   percent_rank() OVER (PARTITION BY vessel_type ORDER BY gross_tonnage) * 100  AS pct_type
              FROM tradeops.vessels
             WHERE gross_tonnage IS NOT NULL
        )
        UPDATE tradeops.vessels v
           SET gt_rank_global  = r.r_global,
               gt_rank_in_type = r.r_type,
               gt_rank_in_flag = CASE WHEN v.flag_country IS NULL THEN NULL ELSE r.r_flag END,
               gt_rank_in_year = CASE WHEN v.year_built   IS NULL THEN NULL ELSE r.r_year END,
               gt_pct_in_type  = ROUND(r.pct_type::numeric, 2),
               context_built_at = now()
          FROM ranked r
         WHERE v.id = r.id`);
    return meta.rowCount;
}

/**
 * One row per cohort a vessel page compares against.
 *
 * Written as a full replace per dimension rather than an upsert: a builder or flag that
 * disappears from the registry between runs must not leave a stale cohort behind for a
 * page to cite.
 */
const COHORTS = [
    { dimension: 'type', keyExpr: 'vessel_type', filter: 'vessel_type IS NOT NULL' },
    { dimension: 'flag', keyExpr: 'flag_country', filter: 'flag_country IS NOT NULL' },
    { dimension: 'year', keyExpr: 'year_built::text', filter: 'year_built IS NOT NULL' },
    { dimension: 'builder', keyExpr: 'builder_name', filter: 'builder_name IS NOT NULL' },
    { dimension: 'decade', keyExpr: "((year_built / 10) * 10)::text", filter: 'year_built IS NOT NULL' },
];

async function buildCohort({ dimension, keyExpr, filter }) {
    await q('DELETE FROM tradeops.vessel_cohort_stats WHERE dimension = $1', [dimension]);
    await q(`
        INSERT INTO tradeops.vessel_cohort_stats
            (dimension, cohort_key, n, with_gt, median_gt, p10_gt, p90_gt, max_gt,
             median_year, oldest_year, newest_year, median_length, updated_at)
        SELECT $1,
               ${keyExpr},
               COUNT(*)::int,
               COUNT(gross_tonnage)::int,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY gross_tonnage)::bigint,
               percentile_cont(0.1) WITHIN GROUP (ORDER BY gross_tonnage)::bigint,
               percentile_cont(0.9) WITHIN GROUP (ORDER BY gross_tonnage)::bigint,
               MAX(gross_tonnage)::bigint,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY year_built)::int,
               MIN(year_built)::int,
               MAX(year_built)::int,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY length_m)::numeric(8,2),
               now()
          FROM tradeops.vessels
         WHERE ${filter}
         GROUP BY ${keyExpr}`, [dimension]);
    // Sequelize does not report a rowCount for INSERT ... SELECT, so the count is read
    // back rather than logged as undefined.
    const [[row]] = await q('SELECT COUNT(*)::int AS n FROM tradeops.vessel_cohort_stats WHERE dimension = $1', [dimension]);
    return row.n;
}

/**
 * The flag x type cross-cut.
 *
 * Only combinations holding at least MIN_CROSS vessels get a cohort, and therefore a page.
 * 212 flags x 26 types is 5,512 possible pairs of which the overwhelming majority hold a
 * handful of hulls; a page per pair would be thousands of near-empty tables, which is the
 * scaled-content shape this whole layer exists to avoid. 274 pairs clear the floor and
 * cover 26,143 vessels between them.
 *
 * `cohort_key` packs both values with a delimiter that cannot occur in either — a flag
 * name can contain spaces, commas and parentheses ("Korea, Republic of"), so the
 * separator has to be something no label carries.
 */
const MIN_CROSS = 25;
const CROSS_SEP = '::';

async function buildFlagTypeCohorts() {
    await q("DELETE FROM tradeops.vessel_cohort_stats WHERE dimension = 'flag_type'");
    await q(`
        INSERT INTO tradeops.vessel_cohort_stats
            (dimension, cohort_key, n, with_gt, median_gt, p10_gt, p90_gt, max_gt,
             median_year, oldest_year, newest_year, median_length, top_builder, top_builder_n, updated_at)
        SELECT 'flag_type',
               v.flag_country || '${CROSS_SEP}' || v.vessel_type,
               COUNT(*)::int,
               COUNT(v.gross_tonnage)::int,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY v.gross_tonnage)::bigint,
               percentile_cont(0.1) WITHIN GROUP (ORDER BY v.gross_tonnage)::bigint,
               percentile_cont(0.9) WITHIN GROUP (ORDER BY v.gross_tonnage)::bigint,
               MAX(v.gross_tonnage)::bigint,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY v.year_built)::int,
               MIN(v.year_built)::int,
               MAX(v.year_built)::int,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY v.length_m)::numeric(8,2),
               NULL, NULL, now()
          FROM tradeops.vessels v
         WHERE v.flag_country IS NOT NULL AND v.vessel_type <> 'other'
         GROUP BY v.flag_country, v.vessel_type
        HAVING COUNT(*) >= ${MIN_CROSS}`);

    // The most prolific yard within each pair — a genuinely different name per page.
    await q(`
        UPDATE tradeops.vessel_cohort_stats s
           SET top_builder = t.builder_name, top_builder_n = t.n
          FROM (
            SELECT DISTINCT ON (flag_country, vessel_type)
                   flag_country, vessel_type, builder_name, COUNT(*)::int AS n
              FROM tradeops.vessels
             WHERE builder_name IS NOT NULL AND flag_country IS NOT NULL AND vessel_type <> 'other'
             GROUP BY flag_country, vessel_type, builder_name
             ORDER BY flag_country, vessel_type, COUNT(*) DESC
          ) t
         WHERE s.dimension = 'flag_type'
           AND s.cohort_key = t.flag_country || '${CROSS_SEP}' || t.vessel_type`);

    // The slug mirrors the URL it is served at: /flags/<flag-slug>/<type>.
    await q(`
        UPDATE tradeops.vessel_cohort_stats s
           SET slug = f.slug || '/' || split_part(s.cohort_key, '${CROSS_SEP}', 2)
          FROM tradeops.vessel_cohort_stats f
         WHERE s.dimension = 'flag_type' AND f.dimension = 'flag'
           AND f.cohort_key = split_part(s.cohort_key, '${CROSS_SEP}', 1)
           AND f.slug IS NOT NULL`);

    const [[row]] = await q("SELECT COUNT(*)::int AS n FROM tradeops.vessel_cohort_stats WHERE dimension = 'flag_type' AND slug IS NOT NULL");
    return row.n;
}

/** The registry as a whole — the denominator every other figure is read against. */
async function buildGlobalCohort() {
    await q("DELETE FROM tradeops.vessel_cohort_stats WHERE dimension = 'global'");
    await q(`
        INSERT INTO tradeops.vessel_cohort_stats
            (dimension, cohort_key, n, with_gt, median_gt, p10_gt, p90_gt, max_gt,
             median_year, oldest_year, newest_year, median_length, updated_at)
        SELECT 'global', 'all',
               COUNT(*)::int, COUNT(gross_tonnage)::int,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY gross_tonnage)::bigint,
               percentile_cont(0.1) WITHIN GROUP (ORDER BY gross_tonnage)::bigint,
               percentile_cont(0.9) WITHIN GROUP (ORDER BY gross_tonnage)::bigint,
               MAX(gross_tonnage)::bigint,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY year_built)::int,
               MIN(year_built)::int, MAX(year_built)::int,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY length_m)::numeric(8,2),
               now()
          FROM tradeops.vessels`);
}

/**
 * The most common flag, type and builder within each cohort.
 *
 * Separate from the aggregate above because a mode is a per-group ORDER BY, not something
 * that composes into the same GROUP BY. DISTINCT ON is the cheap way to take a top-1 per
 * group in Postgres.
 */
async function buildCohortModes() {
    // Most common flag within each vessel type.
    await q(`
        UPDATE tradeops.vessel_cohort_stats s
           SET top_flag = t.flag_country, top_flag_n = t.n
          FROM (
            SELECT DISTINCT ON (vessel_type) vessel_type, flag_country, COUNT(*)::int AS n
              FROM tradeops.vessels
             WHERE flag_country IS NOT NULL AND vessel_type IS NOT NULL
             GROUP BY vessel_type, flag_country
             ORDER BY vessel_type, COUNT(*) DESC
          ) t
         WHERE s.dimension = 'type' AND s.cohort_key = t.vessel_type`);

    // Most common vessel type within each flag state.
    await q(`
        UPDATE tradeops.vessel_cohort_stats s
           SET top_type = t.vessel_type, top_type_n = t.n
          FROM (
            SELECT DISTINCT ON (flag_country) flag_country, vessel_type, COUNT(*)::int AS n
              FROM tradeops.vessels
             WHERE flag_country IS NOT NULL AND vessel_type IS NOT NULL
             GROUP BY flag_country, vessel_type
             ORDER BY flag_country, COUNT(*) DESC
          ) t
         WHERE s.dimension = 'flag' AND s.cohort_key = t.flag_country`);

    // Most prolific builder within each vessel type.
    await q(`
        UPDATE tradeops.vessel_cohort_stats s
           SET top_builder = t.builder_name, top_builder_n = t.n
          FROM (
            SELECT DISTINCT ON (vessel_type) vessel_type, builder_name, COUNT(*)::int AS n
              FROM tradeops.vessels
             WHERE builder_name IS NOT NULL AND vessel_type IS NOT NULL
             GROUP BY vessel_type, builder_name
             ORDER BY vessel_type, COUNT(*) DESC
          ) t
         WHERE s.dimension = 'type' AND s.cohort_key = t.vessel_type`);
}

/** Carrier position, for the company pages that hold little else. */
async function buildCarrierRanks() {
    const [, meta] = await q(`
        WITH ranked AS (
            SELECT id,
                   rank() OVER (ORDER BY registry_vessel_count DESC)                          AS r_global,
                   rank() OVER (PARTITION BY country_code ORDER BY registry_vessel_count DESC) AS r_country,
                   COUNT(*) OVER (PARTITION BY country_code)::int                              AS country_n
              FROM tradeops.carriers
             WHERE deleted_at IS NULL AND company_type = 'commercial'
        )
        UPDATE tradeops.carriers c
           SET fleet_rank_global     = r.r_global,
               fleet_rank_in_country = CASE WHEN c.country_code IS NULL THEN NULL ELSE r.r_country END,
               country_carrier_count = CASE WHEN c.country_code IS NULL THEN NULL ELSE r.country_n END,
               context_built_at      = now()
          FROM ranked r
         WHERE c.id = r.id`);
    return meta.rowCount;
}

async function main() {
    const started = Date.now();

    const vesselsRanked = await buildVesselRanks();
    console.log(`[context] ranked ${vesselsRanked} vessels by tonnage`);

    await buildGlobalCohort();
    for (const cohort of COHORTS) {
        const n = await buildCohort(cohort);
        console.log(`[context] ${String(n).padStart(6)} ${cohort.dimension} cohorts`);
    }
    await buildCohortModes();

    const slugged = await buildCohortSlugs();
    console.log(`[context] ${slugged} builder/flag cohorts given a slug`);

    // After buildCohortSlugs, because the cross slug is derived from the flag's slug.
    const crosses = await buildFlagTypeCohorts();
    console.log(`[context] ${crosses} flag x type cohorts (>= ${MIN_CROSS} vessels each)`);

    const carriersRanked = await buildCarrierRanks();
    console.log(`[context] ranked ${carriersRanked} commercial carriers by fleet size`);

    // Reconcile rather than trust the loop. A vessel with a tonnage but no rank means the
    // window pass silently missed it, and its page would then claim nothing where it
    // should claim a position.
    const [[check]] = await q(`
        SELECT (SELECT COUNT(*)::int FROM tradeops.vessels
                 WHERE gross_tonnage IS NOT NULL AND gt_rank_in_type IS NULL) AS unranked_with_gt,
               (SELECT COUNT(*)::int FROM tradeops.vessels WHERE gt_rank_in_type IS NOT NULL) AS ranked,
               (SELECT COUNT(*)::int FROM tradeops.vessel_cohort_stats) AS cohorts`);
    console.log(`[context] ${check.ranked} vessels carry a rank, ${check.cohorts} cohorts stored`);
    if (check.unranked_with_gt > 0) {
        throw new Error(`${check.unranked_with_gt} vessels have a tonnage but no rank — the window pass missed rows`);
    }

    console.log(`[context] PASS in ${Math.round((Date.now() - started) / 1000)}s`);
}

if (require.main === module) {
    main()
        .then(() => db.sequelize.close().then(() => process.exit(0)))
        .catch((e) => { console.error('[context] FAIL —', e.message); process.exit(1); });
}
module.exports = { main, CROSS_SEP, MIN_CROSS };
