'use strict';
/**
 * Onboard the world's major ocean container lines into the Carrier Directory.
 *
 *   node seedOceanCarriers.js
 *
 * Each carrier is onboarded as DATA — no bespoke integration code. GenericConnector
 * serves any directory row, so these become quotable and bookable the moment this runs,
 * and each one flips from the deterministic simulator to its real API as soon as
 * `<CREDENTIAL_PREFIX>_ENDPOINT` and `<CREDENTIAL_PREFIX>_API_KEY` are set in the
 * environment. No code change, no redeploy of this service's logic.
 *
 * WHAT IS AND IS NOT SEEDED. Identity is real: legal name, headquarters country and
 * the carrier's SCAC where it is unambiguous. Deliberately NOT seeded:
 *
 *   • rate cards      — a carrier's freight rates are commercially confidential. With
 *                       no `carrier_services` row the connector prices off the platform
 *                       default, so every carrier without credentials returns the SAME
 *                       indicative figure. That is the truthful answer to "what does
 *                       this carrier charge" when nobody has told us.
 *   • reliability     — on-time performance is a measured quarterly statistic. Every
 *                       carrier keeps the column default so the ranking is not skewed
 *                       by numbers nobody sourced.
 *   • fleet / coverage— real but volatile, and not needed to quote.
 *
 * Maersk is absent on purpose: it already has a coded connector, and the directory
 * bridge skips any row whose code collides with one.
 *
 * Idempotent — re-running updates the identity fields in place and never duplicates.
 */
const db = require('./models');

/**
 * The major ocean container lines. `code` is the marketplace carrier code (it lands in
 * `freight_bookings.carrier`, so it must match the lower-case slug shape migration 085
 * constrains). `scac` is the Standard Carrier Alpha Code, omitted where it is not
 * unambiguous rather than guessed.
 */
const OCEAN_CARRIERS = [
    { code: 'msc', name: 'MSC Mediterranean Shipping Company', country: 'CH', scac: 'MSCU', prefix: 'MSC' },
    { code: 'cma-cgm', name: 'CMA CGM', country: 'FR', scac: 'CMDU', prefix: 'CMACGM' },
    { code: 'cosco', name: 'COSCO Shipping Lines', country: 'CN', scac: 'COSU', prefix: 'COSCO' },
    { code: 'hapag-lloyd', name: 'Hapag-Lloyd', country: 'DE', scac: 'HLCU', prefix: 'HAPAGLLOYD' },
    { code: 'one', name: 'Ocean Network Express', country: 'SG', scac: 'ONEY', prefix: 'ONE' },
    { code: 'evergreen', name: 'Evergreen Line', country: 'TW', scac: 'EGLV', prefix: 'EVERGREEN' },
    { code: 'hmm', name: 'HMM', country: 'KR', scac: 'HDMU', prefix: 'HMM' },
    { code: 'yang-ming', name: 'Yang Ming Marine Transport', country: 'TW', scac: 'YMLU', prefix: 'YANGMING' },
    { code: 'zim', name: 'ZIM Integrated Shipping Services', country: 'IL', scac: 'ZIMU', prefix: 'ZIM' },
    { code: 'oocl', name: 'Orient Overseas Container Line', country: 'HK', scac: 'OOLU', prefix: 'OOCL' },
    { code: 'wan-hai', name: 'Wan Hai Lines', country: 'TW', scac: 'WHLC', prefix: 'WANHAI' },
    { code: 'pil', name: 'Pacific International Lines', country: 'SG', scac: null, prefix: 'PIL' },
    { code: 'matson', name: 'Matson', country: 'US', scac: 'MATS', prefix: 'MATSON' },
    { code: 'sitc', name: 'SITC International Holdings', country: 'HK', scac: null, prefix: 'SITC' },
    { code: 'x-press-feeders', name: 'X-Press Feeders', country: 'SG', scac: null, prefix: 'XPRESSFEEDERS' },
];

/** Ocean lines also move boxes inland; road lets them quote the door leg of a booking. */
const MODES = ['ocean', 'road'];

function fieldsFor(carrier) {
    return {
        code: carrier.code,
        name: carrier.name,
        country: carrier.country,
        modes: MODES,
        // No coded connector: GenericConnector serves this row.
        connector_key: null,
        credential_env_prefix: carrier.prefix,
        availability_status: 'active',
        // Nothing is integrated until the credentials land. These stay false so the UI
        // never implies a live API that is not there.
        tracking_api_supported: false,
        booking_api_supported: false,
        pricing_api_supported: false,
        metadata_scac: carrier.scac,
    };
}

async function main() {
    const created = [];
    const updated = [];

    for (const carrier of OCEAN_CARRIERS) {
        const fields = fieldsFor(carrier);
        const scac = fields.metadata_scac;
        delete fields.metadata_scac;

        // SCAC lives with the carrier's other identifiers rather than in a bespoke
        // column, so a directory row stays one shape for every mode of transport.
        const existing = await db.CarrierDirectory.findOne({ where: { code: carrier.code } });
        if (existing) {
            await existing.update({
                ...fields,
                services: scac ? { ...(existing.services || {}), scac } : existing.services,
            });
            updated.push(carrier.code);
        } else {
            await db.CarrierDirectory.create({
                ...fields,
                services: scac ? { scac } : [],
            });
            created.push(carrier.code);
        }
    }

    console.log(`[ocean-carriers] created=${created.length} updated=${updated.length}`);
    if (created.length) console.log(`[ocean-carriers] onboarded: ${created.join(', ')}`);

    const oceanCount = await db.CarrierDirectory.count({
        where: db.Sequelize.literal(`modes @> '["ocean"]'::jsonb AND availability_status = 'active'`),
    });
    console.log(`[ocean-carriers] ocean-capable carriers in the directory: ${oceanCount}`);
    console.log('[ocean-carriers] set <PREFIX>_ENDPOINT and <PREFIX>_API_KEY to take any of them live.');
}

main()
    .catch((err) => {
        console.error('[ocean-carriers] failed:', err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.sequelize.close();
    });
