'use strict';
/**
 * GenericConnector — the MANUAL / DEMO-MODE fallback carrier connector (Phase 3,
 * Prompt 2).
 *
 * The Carrier Directory (tradeops.carriers, migration 047) is explicitly designed to
 * support ANY carrier dynamically — "do not hardcode providers". A carrier row with
 * no `connector_key` matching a bespoke coded connector (dhl/fedex/ups/maersk) falls
 * back to THIS connector instead of requiring new integration code before it can be
 * quoted. It mirrors the existing Demo Mode convention used elsewhere in this repo
 * (flip-to-live via env var, no code change needed): when
 * `<credential_env_prefix>_ENDPOINT` + `<credential_env_prefix>_API_KEY` are set it
 * calls the real carrier API; otherwise it prices deterministically off the
 * carrier's own `carrier_services` rate card (base_fee/rate_per_kg) via the same
 * simulator every coded connector uses, so a carrier with zero bespoke code still
 * produces a realistic, reproducible quote.
 *
 * Unlike the coded connectors (which hardcode a RATE_CARD per mode), GenericConnector
 * is constructed PER CARRIER ROW — its rate card comes from the caller (typically the
 * matching tradeops.carrier_services entries), so one class serves every dynamically
 * registered carrier.
 */

const { CarrierConnector } = require('./baseConnector');
const { httpSend } = require('./transport');
const { decideOutcome, deterministicRef, simulatePrice } = require('./simulate');
const { MODE, STATUS, normalizedQuote, normalizedBooking } = require('../schema');
const norm = require('../normalize');
const eta = require('../eta');

const DEFAULT_RATE_CARD = { service: 'STANDARD', base_fee: 30, rate_per_kg: 2.5, fuel_pct: 0.12, transit: 7 };

class GenericConnector extends CarrierConnector {
    /**
     * @param {object} opts
     * @param {string} opts.carrier        the carrier's `code` from tradeops.carriers
     * @param {string} [opts.carrierName]
     * @param {string[]} [opts.modes]      modes this carrier serves (defaults to ROAD)
     * @param {number} [opts.reliability]  0-100, defaults to the carrier's reliability_score
     * @param {object} [opts.rateCardsByMode] { [mode]: { service, base_fee, rate_per_kg, fuel_pct, transit } }
     * @param {string} [opts.endpoint]     overrides `<credential_env_prefix>_ENDPOINT`
     * @param {string} [opts.apiKey]       overrides `<credential_env_prefix>_API_KEY`
     * @param {string} [opts.credentialEnvPrefix]
     */
    constructor(opts = {}) {
        super({ carrier: opts.carrier, carrierName: opts.carrierName, ...opts });
        this.modes = Array.isArray(opts.modes) && opts.modes.length ? opts.modes : [MODE.ROAD];
        this.reliability = opts.reliability != null ? opts.reliability : this.reliability;
        this.rateCardsByMode = opts.rateCardsByMode || {};
        const prefix = opts.credentialEnvPrefix || null;
        this.credentialEnvPrefix = prefix;
        this.endpoint = opts.endpoint || (prefix ? process.env[`${prefix}_ENDPOINT`] : null) || null;
        this.apiKey = opts.apiKey || (prefix ? process.env[`${prefix}_API_KEY`] : null) || null;
    }

    // A dynamically registered carrier has no known lane restrictions to enforce, but it
    // does have to be priceable: without a rate card or credentials for the requested
    // mode there is no honest number to return.
    validateRequest(request) {
        const mode = request && request.mode;
        if (mode && !this._hasUsableCard(mode)) {
            return [{
                code: 'NO_RATE_ON_FILE',
                level: 'error',
                text: `${this.carrierName || this.carrier} is onboarded for ${mode} but has no rate card and no API credentials, so it cannot be priced. Set ${this.credentialEnvPrefix || 'the carrier'}_ENDPOINT and _API_KEY, or add a rate card.`,
            }];
        }
        return [];
    }

    /**
     * The carrier's own rate card for this mode, or the platform default.
     *
     * The default is a parcel/road card (a per-KILO rate and a one-week transit). It is
     * a reasonable stand-in for a road carrier and nonsense for an ocean one: applied to
     * a laden container it produces a six-figure quote and a seven-day sailing. So the
     * default is only ever used for the modes it actually fits — see `_hasUsableCard`.
     */
    _card(mode) { return this.rateCardsByMode[mode] || DEFAULT_RATE_CARD; }

    /**
     * Whether this carrier can be priced for a mode at all.
     *
     * A carrier with credentials is priced by the carrier itself. Otherwise it needs its
     * own rate card, UNLESS the mode is one the platform default actually describes.
     * Ocean and air are priced per container and per chargeable-weight band respectively,
     * on commercially confidential tariffs — inventing one would put a fabricated number
     * in front of a planner, so the carrier declines instead and says why.
     */
    _hasUsableCard(mode) {
        if (this.endpoint && this.apiKey) return true;
        if (this.rateCardsByMode[mode]) return true;
        return mode === MODE.ROAD || mode === MODE.EXPRESS;
    }

    buildQuoteRequest(request, ctx) {
        const card = this._card(ctx.mode);
        const chargeable = norm.chargeableWeightForMode(request, ctx.mode);
        return { origin: request.origin, destination: request.destination, chargeable_weight: chargeable, __sim: { card, chargeable } };
    }

    async transmitQuote(payload, ctx) {
        if (this.endpoint && this.apiKey) {
            return httpSend(this, { url: `${this.endpoint}/rates`, headers: { Authorization: `Bearer ${this.apiKey}` }, payload });
        }
        return this._simRate(payload, ctx);
    }

    _simRate(payload, ctx) {
        const outcome = decideOutcome(ctx.request, { ...ctx, carrier: this.carrier });
        if (!outcome.ok) {
            throw outcome.kind === 'permanent' ? this.failPermanent(outcome.reason, { code: outcome.code }) : this.failTransient(outcome.reason, { code: outcome.code });
        }
        const { card, chargeable } = payload.__sim;
        const { amount, surcharges } = simulatePrice(card, chargeable, ctx.request);
        return { amount, currency: 'USD', transit_days: card.transit, service_level: card.service, surcharges, chargeable };
    }

    parseQuote(raw, ctx) {
        return normalizedQuote({
            carrier: this.carrier,
            service_level: raw.service_level,
            mode: ctx.mode,
            amount: raw.amount,
            currency: raw.currency,
            transit_days: raw.transit_days,
            estimated_delivery: eta.estimateDelivery({ transitDays: raw.transit_days, readyDate: ctx.request.ready_date, now: ctx.now }),
            valid_until: ctx.validUntil || null,
            surcharges: raw.surcharges || [],
            reliability: this.reliability,
            chargeable_weight: raw.chargeable,
            raw,
        });
    }

    buildBookingRequest(request, quote, ctx) {
        return { origin: request.origin, destination: request.destination, __sim: { quote, mode: ctx.mode } };
    }

    async transmitBooking(payload, ctx) {
        if (this.endpoint && this.apiKey) {
            return httpSend(this, { url: `${this.endpoint}/bookings`, headers: { Authorization: `Bearer ${this.apiKey}` }, payload });
        }
        return this._simBooking(payload, ctx);
    }

    _simBooking(payload, ctx) {
        const outcome = decideOutcome(ctx.request, { ...ctx, carrier: this.carrier });
        if (!outcome.ok) {
            throw outcome.kind === 'permanent' ? this.failPermanent(outcome.reason, { code: outcome.code }) : this.failTransient(outcome.reason, { code: outcome.code });
        }
        const tracking = deterministicRef('GEN', ctx.request, this.carrier);
        return { tracking_number: tracking, accepted: true, label_url: null, estimated_delivery: ctx.quote && ctx.quote.estimated_delivery };
    }

    parseBooking(raw, ctx) {
        return normalizedBooking({
            carrier: this.carrier,
            status: raw.accepted ? STATUS.BOOKED : STATUS.FAILED,
            accepted: !!raw.accepted,
            tracking_number: raw.tracking_number || null,
            gateway_reference: raw.tracking_number || null,
            label_url: raw.label_url || null,
            service_level: ctx.quote && ctx.quote.service_level,
            mode: ctx.mode,
            amount: ctx.quote && ctx.quote.amount,
            currency: ctx.quote && ctx.quote.currency,
            estimated_delivery: raw.estimated_delivery || (ctx.quote && ctx.quote.estimated_delivery),
            messages: raw.accepted ? [] : [{ code: 'GENERIC_BOOK_FAILED', level: 'error', text: `${this.carrierName} did not confirm the booking` }],
            raw,
        });
    }
}

module.exports = { GenericConnector, DEFAULT_RATE_CARD };
