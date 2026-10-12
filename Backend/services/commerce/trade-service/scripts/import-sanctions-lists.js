'use strict';
/**
 * Download the official sanctions lists and load them into the compliance engine.
 *
 *   node scripts/import-sanctions-lists.js            # OFAC, UN and EU
 *   node scripts/import-sanctions-lists.js OFAC UN    # chosen lists only
 *   node scripts/import-sanctions-lists.js --force    # accept a large shrink (see importer.js)
 *
 * Exit code is non-zero if ANY list failed or was refused, so a scheduler (cron,
 * CI) pages someone instead of leaving a stale list unnoticed. The service also
 * refreshes the lists itself every six hours (queue/workers.js); this script is
 * for the first load, a manual refresh, and recovery after a refused run.
 */
const { refreshLists, isFailure } = require('../service/compliance/lists/refresh');

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const wanted = args.filter((a) => !a.startsWith('--')).map((a) => a.toUpperCase());

    const results = await refreshLists({ sources: wanted.length ? wanted : undefined, force });
    for (const r of results) {
        if (isFailure(r)) console.error(`${r.source}: ${r.status.toUpperCase()} — ${r.error}`);
        else console.log(`${r.source}: ${r.status} — parsed ${r.parsed}, added ${r.added || 0}, updated ${r.updated || 0}, delisted ${r.delisted || 0} (list dated ${r.listDate})`);
    }
    await require('../models').sequelize.close();
    process.exit(results.some(isFailure) ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
