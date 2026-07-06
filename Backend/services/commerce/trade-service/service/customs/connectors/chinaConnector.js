'use strict';
/**
 * ChinaConnector — GACC International Trade Single Window gateway (PLACEHOLDER)
 * (Phase 1 core-commerce alignment — the audit found China missing from the
 * customs-gateway registry despite being one of the four Phase 1 target markets).
 *
 * Maps a canonical declaration to a China Customs (GACC) declaration and submits
 * it via the International Trade Single Window. China keys the trading party on
 * its 18-digit Unified Social Credit Code (USCC), so the jurisdiction rule is
 * "the trading party must carry a tax_id (USCC)". China also requires a 10-digit
 * (not the 8-digit HTSUS minimum other jurisdictions accept) HS classification on
 * every line. The gateway returns a `customsDeclarationNo` and a `declStatus`
 * (CLEARED / UNDER_REVIEW / REJECTED), collapsed by parseResponse into the
 * normalized shape — mirrors uaeConnector.js / usConnector.js exactly.
 *
 * The live channel needs China e-Port / Single Window enrolment credentials, so
 * `transmit()` only calls the real endpoint when CHINA_SW_ENDPOINT + CHINA_SW_API_KEY
 * are set; otherwise it falls back to the deterministic simulator.
 */

const { CustomsConnector } = require('./baseConnector');
const { httpTransmit } = require('./transport');
const { decideOutcome, deterministicRef } = require('./simulate');
const { CHANNEL, STATUS } = require('../schema');

// GACC native status → normalized status.
const CHINA_STATUS_MAP = {
    CLEARED: STATUS.ACCEPTED,
    RELEASED: STATUS.ACCEPTED,
    UNDER_REVIEW: STATUS.SUBMITTED,
    PENDING: STATUS.SUBMITTED,
    REJECTED: STATUS.REJECTED,
    RETURNED: STATUS.REJECTED,
};

class ChinaConnector extends CustomsConnector {
    constructor(opts = {}) {
        super({ channel: CHANNEL.CHINA_SINGLE_WINDOW, gatewayName: 'China Single Window', ...opts });
        this.endpoint = opts.endpoint || process.env.CHINA_SW_ENDPOINT || null;
        this.apiKey = opts.apiKey || process.env.CHINA_SW_API_KEY || null;
    }

    validateDeclaration(declaration) {
        const errors = [];
        const trader = declaration.entry_type === 'export' ? declaration.exporter : declaration.importer;
        if (!trader || !trader.tax_id) {
            errors.push({ code: 'CN_MISSING_USCC', level: 'error', text: 'GACC requires the 18-digit Unified Social Credit Code (USCC) on the trading party' });
        }
        // The Single Window requires a full 10-digit HS classification on every line.
        declaration.line_items.forEach((l) => {
            const digits = String(l.hs_code || '').replace(/\D/g, '');
            if (digits.length < 10) {
                errors.push({ code: 'CN_SHORT_HS', level: 'error', text: `Line ${l.line_no}: GACC requires a 10-digit HS classification` });
            }
        });
        return errors;
    }

    buildPayload(declaration) {
        const isExport = declaration.entry_type === 'export';
        const trader = (isExport ? declaration.exporter : declaration.importer) || {};
        return {
            declType: isExport ? 'E' : 'I', // Export / Import
            uscc: trader.tax_id || null,
            customsOffice: (declaration.metadata && declaration.metadata.port_code) || 'SHANGHAI',
            totalValue: declaration.customs_value,
            currency: declaration.currency,
            goods: declaration.line_items.map((l) => ({
                hsCode: String(l.hs_code || '').replace(/\D/g, ''),
                description: l.description,
                quantity: l.quantity,
                unit: l.unit,
                originCountry: l.origin_country,
                value: l.value,
            })),
        };
    }

    async transmit(payload, ctx) {
        if (this.endpoint && this.apiKey) {
            return httpTransmit(this, {
                url: this.endpoint,
                headers: { 'X-SW-Key': this.apiKey },
                payload,
            });
        }
        return this._simulate(ctx.declaration, ctx);
    }

    _simulate(declaration, ctx) {
        const outcome = decideOutcome(declaration, ctx);
        if (!outcome.ok) {
            const err = outcome.kind === 'permanent'
                ? this.failPermanent(outcome.reason, { code: outcome.code })
                : this.failTransient(outcome.reason, { code: outcome.code });
            err.raw = { customsDeclarationNo: null, declStatus: 'REJECTED', reason: outcome.code };
            throw err;
        }
        const pending = outcome.mode === 'pending';
        return {
            customsDeclarationNo: deterministicRef('CN', declaration),
            declStatus: pending ? 'UNDER_REVIEW' : 'CLEARED',
            reason: null,
        };
    }

    parseResponse(raw) {
        const s = String((raw && raw.declStatus) || 'UNDER_REVIEW').toUpperCase();
        const status = CHINA_STATUS_MAP[s] || STATUS.SUBMITTED;
        return this.normalize({
            status,
            accepted: status === STATUS.ACCEPTED,
            gateway_reference: (raw && raw.customsDeclarationNo) || null,
            gateway_status: s,
            messages: status === STATUS.REJECTED
                ? [{ code: (raw && raw.reason) || 'REJECTED', level: 'error', text: `China Single Window: ${(raw && raw.reason) || 'rejected'}` }]
                : [],
            retryable: false,
            raw: raw || {},
        });
    }
}

module.exports = { ChinaConnector };
