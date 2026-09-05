'use strict';
/**
 * Stage G — recompute everything the directory shows that is DERIVED from other rows,
 * so no aggregate is ever hand-maintained and drifting.
 *
 *   • carriers.registry_* — counted from the vessels actually held. Explicitly NOT the
 *     company's fleet size; see migration 067.
 *   • carrier_fleet_history — the 10-year track record on a company page, built from
 *     real year_built values. basis='derived' marks it as our arithmetic over the
 *     registry, not a figure the company published.
 *
 *   node scripts/shipping-directory/rollup.js [--years=10]
 */
const db = require('../../models');

const HISTORY_YEARS = 10;

async function main() {
    const arg = (process.argv.find((a) => a.startsWith('--years=')) || '').replace('--years=', '');
    const years = Number(arg) || HISTORY_YEARS;
    const endYear = new Date().getFullYear();
    const startYear = endYear - years + 1;

    console.log('[rollup] recomputing registry counts on carriers...');
    const [, countMeta] = await db.sequelize.query(`
        UPDATE tradeops.carriers c SET
            registry_vessel_count = COALESCE(v.n, 0),
            registry_gt           = v.gt,
            registry_teu          = v.teu,
            registry_dwt          = v.dwt,
            updated_at            = now()
        FROM (
            SELECT ca.id,
                   COUNT(ve.id)                AS n,
                   SUM(ve.gross_tonnage)       AS gt,
                   SUM(ve.capacity_teu)        AS teu,
                   SUM(ve.deadweight_tons)     AS dwt
            FROM tradeops.carriers ca
            LEFT JOIN tradeops.vessels ve ON ve.carrier_id = ca.id
            GROUP BY ca.id
        ) v
        WHERE v.id = c.id`);
    console.log(`  updated ${countMeta.rowCount} carriers`);

    // Only carriers with at least one dated vessel get a history — an all-zero decade for
    // a carrier we hold no ships for would read as "this company shrank to nothing".
    console.log(`[rollup] building ${years}-year fleet history (${startYear}-${endYear})...`);
    const [, histMeta] = await db.sequelize.query(
        `
        INSERT INTO tradeops.carrier_fleet_history
            (carrier_id, year, basis, vessels_delivered, cumulative_vessels,
             teu_delivered, cumulative_teu, gt_delivered, data_source, source_url)
        SELECT cy.carrier_id,
               cy.year,
               'derived',
               COALESCE(d.n, 0),
               COALESCE(cum.n, 0),
               d.teu,
               cum.teu,
               d.gt,
               'wikidata',
               'https://www.wikidata.org/'
        FROM (
            SELECT c.id AS carrier_id, gs.year
            FROM tradeops.carriers c
            CROSS JOIN generate_series($startYear::int, $endYear::int) AS gs(year)
            WHERE EXISTS (
                SELECT 1 FROM tradeops.vessels v
                WHERE v.carrier_id = c.id AND v.year_built IS NOT NULL
            )
        ) cy
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS n, SUM(v.capacity_teu) AS teu, SUM(v.gross_tonnage) AS gt
            FROM tradeops.vessels v
            WHERE v.carrier_id = cy.carrier_id AND v.year_built = cy.year
        ) d ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS n, SUM(v.capacity_teu) AS teu
            FROM tradeops.vessels v
            WHERE v.carrier_id = cy.carrier_id AND v.year_built <= cy.year
        ) cum ON true
        ON CONFLICT (carrier_id, year, basis) DO UPDATE SET
            vessels_delivered  = EXCLUDED.vessels_delivered,
            cumulative_vessels = EXCLUDED.cumulative_vessels,
            teu_delivered      = EXCLUDED.teu_delivered,
            cumulative_teu     = EXCLUDED.cumulative_teu,
            gt_delivered       = EXCLUDED.gt_delivered,
            updated_at         = now()`,
        { bind: { startYear, endYear } },
    );
    // An INSERT ... ON CONFLICT reports no rowCount through this driver path, so count.
    const [[histCount]] = await db.sequelize.query(
        `SELECT COUNT(*)::int AS n FROM tradeops.carrier_fleet_history WHERE year BETWEEN $startYear AND $endYear`,
        { bind: { startYear, endYear } },
    );
    console.log(`  ${histCount.n} history rows now cover ${startYear}-${endYear}`);

    const [[stats]] = await db.sequelize.query(`
        SELECT
            (SELECT COUNT(*) FROM tradeops.carriers)                                       AS carriers,
            (SELECT COUNT(*) FROM tradeops.carriers WHERE registry_vessel_count > 0)       AS carriers_with_ships,
            (SELECT COUNT(*) FROM tradeops.carriers WHERE reported_fleet_size IS NOT NULL) AS carriers_with_reported,
            (SELECT COUNT(*) FROM tradeops.vessels)                                        AS vessels,
            (SELECT COUNT(*) FROM tradeops.vessels WHERE carrier_id IS NOT NULL)           AS vessels_linked,
            (SELECT COUNT(*) FROM tradeops.carrier_fleet_history)                          AS history_rows`);
    console.log('[rollup] PASS');
    console.table(stats);
}

if (require.main === module) {
    main()
        .then(() => db.sequelize.close().then(() => process.exit(0)))
        .catch((e) => { console.error('[rollup] FAIL —', e.message); process.exit(1); });
}
module.exports = { main };
