'use strict';
/**
 * Fund administrators and registered agents file hundreds of unrelated entities from one suite.
 * Left alone, that address becomes a "location": one Seattle building held 1,415 venture firms and
 * a Claymont mail drop held 240. The firms are real; the city is not theirs.
 *
 * This keeps the filed address — it is what the record says — but stops treating it as a place, so
 * those firms no longer appear on city or state pages claiming to be there. Country is left intact,
 * which is still true.
 *
 * Run after any ingest: the ingest rewrites city from the filing and would otherwise undo this.
 *   node scripts/flag-service-addresses.js [--min=100]
 */
const db = require('../models');

const arg = (k, d) => {
    const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
    return hit ? hit.split('=')[1] : d;
};
const MIN = Number(arg('min', 100));

const SQL = (table) => `
    WITH hubs AS (
      SELECT lower(regexp_replace(street, '[^a-z0-9]+', '', 'gi')) k, city
        FROM "${table}" WHERE street IS NOT NULL AND city IS NOT NULL
       GROUP BY 1,2 HAVING COUNT(*) >= :min
    )
    UPDATE "${table}" t
       SET address_is_service = TRUE, city = NULL, city_slug = NULL, state = NULL, state_slug = NULL
      FROM hubs h
     WHERE lower(regexp_replace(t.street, '[^a-z0-9]+', '', 'gi')) = h.k AND t.city = h.city
`;

(async () => {
    const schema = db.sequelize.options.define?.schema || 'insiders';
    for (const t of ['investors', 'companies']) {
        const [, meta] = await db.sequelize.query(SQL(`${schema}"."${t}`), { replacements: { min: MIN } });
        console.log(`[service-addresses] ${t}: ${meta?.rowCount ?? 0} row(s) de-located`);
    }
    process.exit(0);
})().catch((e) => { console.error('[service-addresses] failed:', e); process.exit(1); });
