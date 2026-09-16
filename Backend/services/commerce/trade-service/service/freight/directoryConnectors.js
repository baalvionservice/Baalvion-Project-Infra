'use strict';
/**
 * Carrier Directory → marketplace bridge.
 *
 * The marketplace quote/booking engine originally fanned out to four hardcoded
 * connectors. The Carrier Directory (tradeops.carriers, migration 047) exists so a
 * carrier can be onboarded as DATA — GenericConnector already serves any row without
 * bespoke code — but nothing joined the two, so a directory carrier could never be
 * quoted by the marketplace or booked. This module is that join.
 *
 * A directory row becomes a connector when it is `active` and declares the mode being
 * quoted. Its rate card comes from its own `carrier_services` rows; with none, the
 * GenericConnector default applies and the quote is an indicative figure, exactly as
 * for a coded connector without credentials.
 *
 * CREDENTIALS. Each row carries `credential_env_prefix`; setting
 * `<PREFIX>_ENDPOINT` and `<PREFIX>_API_KEY` flips that carrier from the deterministic
 * simulator to its real API with no code change.
 *
 * Rows are cached briefly — a quote fans out across every eligible carrier, and
 * re-reading the directory once per carrier per request would be pointless load.
 */
const db = require('../../models');
const registry = require('./connectors');

const CACHE_TTL_MS = 60_000;
let cache = { at: 0, rows: [] };

/** Active directory carriers with their rate cards, cached for a minute. */
async function loadCarriers() {
    if (Date.now() - cache.at < CACHE_TTL_MS) return cache.rows;

    const carriers = await db.CarrierDirectory.findAll({
        where: { availability_status: 'active' },
        order: [['name', 'ASC']],
    });

    // One query for every rate card, then grouped in memory — a per-carrier query here
    // would be N+1 across the whole directory.
    const services = carriers.length
        ? await db.CarrierService.findAll({ where: { carrier_id: carriers.map((c) => c.id) } })
        : [];
    const byCarrier = new Map();
    for (const service of services) {
        if (!byCarrier.has(service.carrier_id)) byCarrier.set(service.carrier_id, []);
        byCarrier.get(service.carrier_id).push(service);
    }

    cache = {
        at: Date.now(),
        rows: carriers.map((row) => ({ row, services: byCarrier.get(row.id) || [] })),
    };
    return cache.rows;
}

/** Drop the cache — used after onboarding a carrier, and by tests. */
function resetDirectoryCache() {
    cache = { at: 0, rows: [] };
}

const servesMode = (row, mode) => {
    const modes = Array.isArray(row.modes) ? row.modes : [];
    return !mode || modes.includes(mode);
};

/**
 * Connectors for every directory carrier eligible to serve this request's mode.
 * A row whose `code` matches a coded connector is skipped: the coded one already
 * fans out, and quoting the same carrier twice would double it in the comparison.
 */
async function eligibleDirectoryConnectors(request = {}) {
    const mode = request.mode || null;
    // A directory carrier only quotes a mode it actually declares. Without a mode on
    // the request there is no way to tell, so the directory sits it out rather than
    // fanning out across 1,700 rows.
    if (!mode) return [];

    const coded = new Set(registry.supportedCarriers());
    const rows = await loadCarriers();

    return rows
        .filter(({ row }) => servesMode(row, mode) && !coded.has(row.code))
        .map(({ row, services }) => registry.buildConnectorForCarrier(row, { services }))
        .filter((connector) => connector && connector.serves(mode));
}

/** Resolve one directory carrier's connector by its code, or null. */
async function directoryConnectorByCarrier(code) {
    if (!code) return null;
    const rows = await loadCarriers();
    const found = rows.find(({ row }) => row.code === code);
    return found ? registry.buildConnectorForCarrier(found.row, { services: found.services }) : null;
}

/**
 * Every connector that can quote this request: the coded ones plus the directory.
 * Coded connectors come first so an onboarded duplicate can never displace a bespoke
 * integration.
 */
async function allEligibleConnectors(request = {}) {
    const coded = registry.eligibleConnectors(request);
    const directory = await eligibleDirectoryConnectors(request);
    const seen = new Set(coded.map((c) => c.carrier));
    return [...coded, ...directory.filter((c) => !seen.has(c.carrier))];
}

/** Resolve a connector by carrier code across both the coded set and the directory. */
async function resolveConnector(code) {
    return registry.getConnectorByCarrier(code) || directoryConnectorByCarrier(code);
}

module.exports = {
    loadCarriers,
    resetDirectoryCache,
    eligibleDirectoryConnectors,
    directoryConnectorByCarrier,
    allEligibleConnectors,
    resolveConnector,
};
