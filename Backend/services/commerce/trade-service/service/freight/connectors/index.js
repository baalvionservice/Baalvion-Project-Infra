'use strict';
/**
 * Carrier connector REGISTRY (Prompt 10).
 *
 * The single place a CARRIER (or a transport MODE) is resolved to a live connector
 * instance. Connectors are singletons (stateless aside from their env config), lazily
 * constructed on first use. The registry is PLUGGABLE: a new carrier integration can
 * be registered at runtime via `registerConnector()` without touching the quote
 * engine or the booking gateway — mirroring the customs connector registry's seam.
 *
 * `eligibleConnectors(request)` is the carrier-abstraction entry point the quote
 * comparison engine fans out across: it returns every connector that can serve the
 * shipment's mode (an ocean-only request never reaches an express-only carrier).
 */

const { CARRIER, carriersForMode, VALID_CARRIERS } = require('../schema');
const { CarrierConnector } = require('./baseConnector');
const { DhlConnector } = require('./dhlConnector');
const { FedexConnector } = require('./fedexConnector');
const { UpsConnector } = require('./upsConnector');
const { MaerskConnector } = require('./maerskConnector');
const { GenericConnector, DEFAULT_RATE_CARD } = require('./genericConnector');

// carrier → factory (lazy: construct once, on demand).
const FACTORIES = {
    [CARRIER.DHL]: () => new DhlConnector(),
    [CARRIER.FEDEX]: () => new FedexConnector(),
    [CARRIER.UPS]: () => new UpsConnector(),
    [CARRIER.MAERSK]: () => new MaerskConnector(),
};

const instances = {};

/** Get (or lazily build) the connector for a carrier. */
function getConnectorByCarrier(carrier) {
    if (!carrier) return null;
    if (instances[carrier]) return instances[carrier];
    const factory = FACTORIES[carrier];
    if (!factory) return null;
    instances[carrier] = factory();
    return instances[carrier];
}

/**
 * Every connector eligible to serve a shipment request. Eligibility = the connector
 * serves the request's mode (null mode ⇒ every registered carrier is eligible and
 * will quote its own best mode). This is the fan-out set for the comparison engine.
 */
function eligibleConnectors(request = {}) {
    const carriers = carriersForMode(request.mode || null);
    return carriers
        .map((c) => getConnectorByCarrier(c))
        .filter((c) => c && (!request.mode || c.serves(request.mode)));
}

/**
 * Register (or override) a connector for a carrier. Accepts either a CarrierConnector
 * INSTANCE or a zero-arg factory. Enables a new carrier — or a mock in tests —
 * without editing this file.
 */
function registerConnector(carrier, connectorOrFactory) {
    if (typeof connectorOrFactory === 'function') {
        FACTORIES[carrier] = connectorOrFactory;
        delete instances[carrier];
        return;
    }
    if (connectorOrFactory instanceof CarrierConnector) {
        FACTORIES[carrier] = () => connectorOrFactory;
        instances[carrier] = connectorOrFactory;
        return;
    }
    throw new Error('registerConnector(): expected a CarrierConnector instance or a factory function');
}

/** Reset registry overrides back to the built-in connectors (test hygiene). */
function resetConnectors() {
    Object.keys(instances).forEach((k) => delete instances[k]);
    FACTORIES[CARRIER.DHL] = () => new DhlConnector();
    FACTORIES[CARRIER.FEDEX] = () => new FedexConnector();
    FACTORIES[CARRIER.UPS] = () => new UpsConnector();
    FACTORIES[CARRIER.MAERSK] = () => new MaerskConnector();
}

/** The carriers the registry can currently serve. */
function supportedCarriers() {
    return VALID_CARRIERS.filter((c) => typeof FACTORIES[c] === 'function');
}

// carrier connector_key → coded connector factory. Used ONLY by
// buildConnectorForCarrier() below, for the Carrier Directory (Phase 3, Prompt 2)
// quote flow — kept separate from FACTORIES/getConnectorByCarrier so the existing
// freight-marketplace booking path (bound to schema.CARRIER's 4-carrier enum) is
// untouched.
const CODED_CONNECTOR_FACTORIES = {
    [CARRIER.DHL]: () => new DhlConnector(),
    [CARRIER.FEDEX]: () => new FedexConnector(),
    [CARRIER.UPS]: () => new UpsConnector(),
    [CARRIER.MAERSK]: () => new MaerskConnector(),
};

/**
 * Build the connector for a DYNAMIC carrier row (tradeops.carriers, migration 047).
 * If `carrierRow.connector_key` matches a bespoke coded connector (dhl/fedex/ups/
 * maersk), that connector is used; otherwise the carrier is served by
 * GenericConnector, so "any carrier dynamically" always produces a connector — no
 * carrier onboarding is blocked on writing new integration code.
 *
 * @param {object} carrierRow  a tradeops.carriers row (plain object or Sequelize instance)
 * @param {object} [opts]
 * @param {Array}  [opts.services]  matching tradeops.carrier_services rows (rate cards)
 * @returns {CarrierConnector}
 */
function buildConnectorForCarrier(carrierRow, opts = {}) {
    const row = carrierRow && carrierRow.toJSON ? carrierRow.toJSON() : carrierRow;
    const key = row && row.connector_key;
    if (key && CODED_CONNECTOR_FACTORIES[key]) return CODED_CONNECTOR_FACTORIES[key]();

    const rateCardsByMode = {};
    (opts.services || []).forEach((svc) => {
        const s = svc && svc.toJSON ? svc.toJSON() : svc;
        if (!s || !s.transport_mode) return;
        rateCardsByMode[s.transport_mode] = {
            service: s.service_type || 'STANDARD',
            base_fee: Number(s.base_fee) || DEFAULT_RATE_CARD.base_fee,
            rate_per_kg: Number(s.rate_per_kg) || 2.5,
            fuel_pct: 0.12,
            transit: s.transit_time_days || 7,
        };
    });

    return new GenericConnector({
        carrier: row.code,
        carrierName: row.name,
        modes: Array.isArray(row.modes) ? row.modes : undefined,
        reliability: row.reliability_score,
        rateCardsByMode,
        credentialEnvPrefix: row.credential_env_prefix || null,
    });
}

module.exports = {
    getConnectorByCarrier,
    eligibleConnectors,
    registerConnector,
    resetConnectors,
    supportedCarriers,
    buildConnectorForCarrier,
    // re-export the connector classes for direct use / testing
    CarrierConnector,
    DhlConnector,
    FedexConnector,
    UpsConnector,
    MaerskConnector,
    GenericConnector,
};
