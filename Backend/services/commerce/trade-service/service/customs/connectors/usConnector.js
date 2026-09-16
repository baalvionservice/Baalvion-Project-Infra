'use strict';
/**
 * USConnector — CBP ACE via ABI (real integration).
 *
 * Files an Importer Security Filing (ISF, "10+2") and an entry summary as
 * CATAIR fixed-width records over mutual TLS.
 *
 * WHY ISF IS TREATED AS A FIRST-CLASS MESSAGE. Its deadline runs from LADING at
 * the origin port, 24 hours before the container is loaded — not from arrival.
 * By the time a vessel is at sea the deadline is gone, and the penalty is
 * liquidated damages rather than a delay. It is therefore modelled as its own
 * message with its own validation, not as a field on the entry.
 *
 * THE TEN ELEMENTS are enforced in validateDeclaration(), because ISF is
 * rejected wholesale when one is absent and the failure is expensive. Two of the
 * twelve (vessel stow plan and container status messages) are the CARRIER's to
 * file and are deliberately not our concern.
 *
 * SPEC BINDING. Column positions live in LAYOUTS below and nowhere else.
 * CATAIR chapters are versioned and revised, and `validateLayout()` refuses an
 * overlapping or out-of-bounds field at load time, so a mistranscribed column is
 * caught here rather than by CBP.
 */

const { CustomsConnector } = require('./baseConnector');
const transport = require('./transport');
const fw = require('./fixedWidth');
const { CHANNEL, STATUS } = require('../schema');

const MESSAGE_TYPE = Object.freeze({ ISF: 'ISF', ENTRY_SUMMARY: 'ENTRY_SUMMARY' });

/**
 * CATAIR record layouts — THE spec-binding point. Reconcile column positions
 * against the CBP CATAIR chapter for the message and version you are certified
 * on. The composition engine enforces the record width, so a wrong position
 * fails loudly here instead of silently shifting every field after it.
 */
const LAYOUTS = Object.freeze({
    // Message header, common to every ABI transmission.
    header: {
        name: 'ABI message header',
        recordId: 'A',
        recordLength: 80,
        fields: [
            { name: 'recordId', start: 1, length: 1, type: fw.TYPE.AN, value: 'A' },
            { name: 'applicationId', start: 2, length: 2, type: fw.TYPE.AN, required: true },
            { name: 'filerCode', start: 4, length: 3, type: fw.TYPE.AN, required: true },
            { name: 'transmissionDate', start: 7, length: 8, type: fw.TYPE.D8, required: true },
            { name: 'senderId', start: 15, length: 12, type: fw.TYPE.AN, required: true },
            { name: 'messageRef', start: 27, length: 20, type: fw.TYPE.AN },
            { name: 'testIndicator', start: 47, length: 1, type: fw.TYPE.AN },
        ],
    },

    // ISF header — the shipment-level elements.
    isfHeader: {
        name: 'ISF header',
        recordId: '10',
        recordLength: 80,
        fields: [
            { name: 'recordId', start: 1, length: 2, type: fw.TYPE.AN, value: '10' },
            { name: 'actionCode', start: 3, length: 2, type: fw.TYPE.AN, required: true },   // add / replace / delete
            { name: 'isfType', start: 5, length: 2, type: fw.TYPE.AN, required: true },      // shipment type
            { name: 'importerOfRecord', start: 7, length: 12, type: fw.TYPE.AN, required: true },
            { name: 'consigneeNumber', start: 19, length: 12, type: fw.TYPE.AN, required: true },
            { name: 'billOfLading', start: 31, length: 16, type: fw.TYPE.AN, required: true },
            { name: 'estimatedLadingDate', start: 47, length: 8, type: fw.TYPE.D8, required: true },
            { name: 'portOfLading', start: 55, length: 5, type: fw.TYPE.AN, required: true },
            { name: 'portOfUnlading', start: 60, length: 4, type: fw.TYPE.AN },
        ],
    },

    // ISF party record — repeated for seller, buyer, manufacturer, ship-to,
    // stuffing location and consolidator.
    isfParty: {
        name: 'ISF party',
        recordId: '20',
        recordLength: 80,
        fields: [
            { name: 'recordId', start: 1, length: 2, type: fw.TYPE.AN, value: '20' },
            { name: 'partyType', start: 3, length: 2, type: fw.TYPE.AN, required: true },
            { name: 'partyName', start: 5, length: 35, type: fw.TYPE.AN, required: true },
            { name: 'partyAddress', start: 40, length: 32, type: fw.TYPE.AN },
            { name: 'partyCountry', start: 72, length: 2, type: fw.TYPE.A, required: true },
        ],
    },

    // ISF line — commodity level.
    isfLine: {
        name: 'ISF commodity line',
        recordId: '30',
        recordLength: 80,
        fields: [
            { name: 'recordId', start: 1, length: 2, type: fw.TYPE.AN, value: '30' },
            { name: 'lineNumber', start: 3, length: 4, type: fw.TYPE.N, required: true },
            { name: 'htsNumber', start: 7, length: 10, type: fw.TYPE.AN, required: true },
            { name: 'countryOfOrigin', start: 17, length: 2, type: fw.TYPE.A, required: true },
            { name: 'description', start: 19, length: 40, type: fw.TYPE.AN, required: true },
        ],
    },

    // Entry summary header (CBP 7501 data set).
    entryHeader: {
        name: 'Entry summary header',
        recordId: '40',
        recordLength: 80,
        fields: [
            { name: 'recordId', start: 1, length: 2, type: fw.TYPE.AN, value: '40' },
            { name: 'entryNumber', start: 3, length: 11, type: fw.TYPE.AN },
            { name: 'entryType', start: 14, length: 2, type: fw.TYPE.AN, required: true },
            { name: 'portOfEntry', start: 16, length: 4, type: fw.TYPE.AN, required: true },
            { name: 'importerOfRecord', start: 20, length: 12, type: fw.TYPE.AN, required: true },
            { name: 'entryDate', start: 32, length: 8, type: fw.TYPE.D8, required: true },
            { name: 'countryOfOrigin', start: 40, length: 2, type: fw.TYPE.A, required: true },
            // 13 digits with two implied decimals — anything larger throws
            // rather than truncating, which would understate entered value.
            { name: 'enteredValue', start: 42, length: 13, type: fw.TYPE.N, decimals: 2, required: true },
        ],
    },

    // ── Response records ────────────────────────────────────────────────────
    // ABI answers in the same fixed-width form it is fed. Parsing these with the
    // layout engine rather than ad-hoc string offsets means a column change is a
    // table edit here, and a mistranscribed position is caught by
    // validateLayout() instead of silently yielding a truncated status code.
    dispositionResponse: {
        name: 'ABI disposition response',
        recordId: '60',
        recordLength: 80,
        fields: [
            { name: 'recordId', start: 1, length: 2, type: fw.TYPE.AN },
            { name: 'dispositionCode', start: 3, length: 3, type: fw.TYPE.AN },
            { name: 'referenceNumber', start: 6, length: 16, type: fw.TYPE.AN },
            { name: 'dispositionDate', start: 22, length: 8, type: fw.TYPE.AN },
        ],
    },

    errorResponse: {
        name: 'ABI error response',
        recordId: '90',
        recordLength: 80,
        fields: [
            { name: 'recordId', start: 1, length: 2, type: fw.TYPE.AN },
            { name: 'errorCode', start: 3, length: 6, type: fw.TYPE.AN },
            { name: 'errorText', start: 9, length: 70, type: fw.TYPE.AN },
        ],
    },

    entryLine: {
        name: 'Entry summary line',
        recordId: '50',
        recordLength: 80,
        fields: [
            { name: 'recordId', start: 1, length: 2, type: fw.TYPE.AN, value: '50' },
            { name: 'lineNumber', start: 3, length: 4, type: fw.TYPE.N, required: true },
            { name: 'htsNumber', start: 7, length: 10, type: fw.TYPE.AN, required: true },
            { name: 'countryOfOrigin', start: 17, length: 2, type: fw.TYPE.A, required: true },
            { name: 'quantity', start: 19, length: 12, type: fw.TYPE.N, decimals: 3 },
            { name: 'unitOfMeasure', start: 31, length: 3, type: fw.TYPE.AN },
            { name: 'lineValue', start: 34, length: 13, type: fw.TYPE.N, decimals: 2, required: true },
        ],
    },
});

// ISF party type codes used on the isfParty record.
const PARTY_TYPE = Object.freeze({
    SELLER: 'SE',
    BUYER: 'BY',
    MANUFACTURER: 'MF',
    SHIP_TO: 'ST',
    STUFFING_LOCATION: 'SL',
    CONSOLIDATOR: 'CS',
});

/**
 * ABI disposition codes → the normalized ladder.
 *
 * ACCEPTED on an ISF means the filing is on record — it does NOT mean the cargo
 * is released, which only the entry does. Conflating them would tell a customer
 * their container can move when nothing has cleared.
 */
const ABI_STATUS = Object.freeze({
    ACC: STATUS.ACCEPTED,
    ACCEPTED: STATUS.ACCEPTED,
    REL: STATUS.ACCEPTED,        // released
    RELEASED: STATUS.ACCEPTED,
    REJ: STATUS.REJECTED,
    REJECTED: STATUS.REJECTED,
    ERR: STATUS.REJECTED,
    PEN: STATUS.SUBMITTED,
    PENDING: STATUS.SUBMITTED,
    RCV: STATUS.SUBMITTED,
    RECEIVED: STATUS.SUBMITTED,
    HOLD: STATUS.SUBMITTED,      // held for exam — open, not rejected
    EXAM: STATUS.SUBMITTED,
});

/** IOR number: an EIN (12-3456789), an SSN, or a CBP-assigned number. */
const IOR_PATTERN = /^(\d{2}-?\d{7}(-?\d{2})?|\d{9}|[A-Z]{3}\d{6})$/;

class USConnector extends CustomsConnector {
    constructor(opts = {}) {
        super({ channel: CHANNEL.ACE, gatewayName: 'CBP ACE', ...opts });
        this.messageType = opts.messageType || MESSAGE_TYPE.ISF;
        // CBP requires certification testing before production. Transmitting a
        // live-flagged message from a system still in test is a compliance
        // problem, so the flag is explicit rather than inferred.
        this.testMode = String(opts.testMode ?? process.env.ACE_TEST_MODE ?? 'true') === 'true';
    }

    validateDeclaration(declaration) {
        const errors = [];
        const meta = declaration.metadata || {};
        const importer = declaration.importer || {};

        if (!importer.tax_id) {
            errors.push({ code: 'US_MISSING_IOR', level: 'error', text: 'CBP requires an importer of record number (EIN, SSN or CBP-assigned)' });
        } else if (!IOR_PATTERN.test(String(importer.tax_id).toUpperCase().replace(/\s/g, ''))) {
            errors.push({ code: 'US_BAD_IOR', level: 'error', text: `Importer of record number "${importer.tax_id}" is not a recognised format` });
        }

        for (const line of declaration.line_items || []) {
            const hts = String(line.hs_code || '').replace(/\D/g, '');
            // ISF accepts the 6-digit HTS; an entry summary needs the full
            // 10-digit US tariff line, so the requirement depends on the message.
            const minDigits = this.messageType === MESSAGE_TYPE.ISF ? 6 : 10;
            if (hts.length < minDigits) {
                errors.push({
                    code: 'US_HTS_TOO_SHORT',
                    level: 'error',
                    text: `Line ${line.line_no}: ${this.messageType} requires a ${minDigits}-digit HTSUS number; "${line.hs_code}" has ${hts.length} digits`,
                });
            }
            if (!line.origin_country) {
                errors.push({ code: 'US_MISSING_ORIGIN', level: 'error', text: `Line ${line.line_no}: country of origin is required` });
            }
            if (!line.description) {
                errors.push({ code: 'US_MISSING_DESCRIPTION', level: 'error', text: `Line ${line.line_no}: a commodity description is required` });
            }
        }

        if (this.messageType === MESSAGE_TYPE.ISF) {
            // The ten importer-filed elements. ISF is rejected wholesale when one
            // is missing, and the deadline has usually passed by the time that is
            // discovered, so each absence is named individually.
            const required = [
                ['seller', declaration.exporter && declaration.exporter.name, 'Seller (the party selling the goods)'],
                ['buyer', declaration.importer && declaration.importer.name, 'Buyer (the party purchasing the goods)'],
                ['importer_of_record', importer.tax_id, 'Importer of record number'],
                ['consignee', meta.consignee_number || importer.tax_id, 'Consignee number'],
                ['manufacturer', meta.manufacturer_name, 'Manufacturer or supplier name'],
                ['ship_to', meta.ship_to_name, 'Ship-to party'],
                ['container_stuffing_location', meta.stuffing_location, 'Container stuffing location'],
                ['consolidator', meta.consolidator_name, 'Consolidator (stuffer)'],
                ['bill_of_lading', meta.bill_of_lading_no, 'Bill of lading number'],
                ['estimated_lading_date', meta.estimated_lading_date || meta.etd, 'Estimated date of lading at the foreign port'],
            ];
            for (const [key, value, label] of required) {
                if (!value) {
                    errors.push({
                        code: `US_ISF_MISSING_${key.toUpperCase()}`,
                        level: 'error',
                        text: `ISF element missing: ${label}. ISF is due 24 hours before lading, so a missing element is usually discovered after the deadline has passed.`,
                    });
                }
            }
            if (!meta.port_of_lading) {
                errors.push({ code: 'US_ISF_MISSING_PORT_OF_LADING', level: 'error', text: 'ISF requires the foreign port of lading' });
            }
        }

        return errors;
    }

    buildPayload(declaration, ctx = {}) {
        const cfg = ctx.cfg || {};
        const meta = declaration.metadata || {};
        const isIsf = this.messageType === MESSAGE_TYPE.ISF;

        const records = [{
            layout: LAYOUTS.header,
            values: {
                applicationId: isIsf ? 'SF' : 'ES',
                filerCode: cfg.filerCode,
                transmissionDate: new Date(),
                senderId: cfg.senderId,
                messageRef: ctx.idempotencyKey || null,
                testIndicator: this.testMode ? 'T' : 'P',
            },
        }];

        if (isIsf) {
            records.push({
                layout: LAYOUTS.isfHeader,
                values: {
                    actionCode: meta.isf_action || 'A',
                    isfType: meta.isf_type || '01',
                    importerOfRecord: String(declaration.importer.tax_id).replace(/-/g, ''),
                    consigneeNumber: String(meta.consignee_number || declaration.importer.tax_id).replace(/-/g, ''),
                    billOfLading: meta.bill_of_lading_no,
                    estimatedLadingDate: meta.estimated_lading_date || meta.etd,
                    portOfLading: meta.port_of_lading,
                    portOfUnlading: meta.port_of_unlading || null,
                },
            });

            const parties = [
                [PARTY_TYPE.SELLER, declaration.exporter, declaration.origin_country],
                [PARTY_TYPE.BUYER, declaration.importer, declaration.destination_country],
                [PARTY_TYPE.MANUFACTURER, { name: meta.manufacturer_name, address: meta.manufacturer_address }, meta.manufacturer_country || declaration.origin_country],
                [PARTY_TYPE.SHIP_TO, { name: meta.ship_to_name, address: meta.ship_to_address }, declaration.destination_country],
                [PARTY_TYPE.STUFFING_LOCATION, { name: meta.stuffing_location, address: meta.stuffing_address }, meta.stuffing_country || declaration.origin_country],
                [PARTY_TYPE.CONSOLIDATOR, { name: meta.consolidator_name, address: meta.consolidator_address }, meta.consolidator_country || declaration.origin_country],
            ];
            for (const [partyType, party, country] of parties) {
                if (!party || !party.name) continue;
                records.push({
                    layout: LAYOUTS.isfParty,
                    values: { partyType, partyName: party.name, partyAddress: party.address, partyCountry: country },
                });
            }

            for (const line of declaration.line_items || []) {
                records.push({
                    layout: LAYOUTS.isfLine,
                    values: {
                        lineNumber: line.line_no,
                        htsNumber: String(line.hs_code || '').replace(/\D/g, ''),
                        countryOfOrigin: line.origin_country,
                        description: line.description,
                    },
                });
            }
        } else {
            records.push({
                layout: LAYOUTS.entryHeader,
                values: {
                    entryNumber: meta.entry_number || null,
                    entryType: meta.entry_type_code || '01',
                    portOfEntry: meta.port_of_entry,
                    importerOfRecord: String(declaration.importer.tax_id).replace(/-/g, ''),
                    entryDate: meta.entry_date || new Date(),
                    countryOfOrigin: declaration.origin_country,
                    enteredValue: declaration.customs_value,
                },
            });
            for (const line of declaration.line_items || []) {
                records.push({
                    layout: LAYOUTS.entryLine,
                    values: {
                        lineNumber: line.line_no,
                        htsNumber: String(line.hs_code || '').replace(/\D/g, ''),
                        countryOfOrigin: line.origin_country,
                        quantity: line.quantity,
                        unitOfMeasure: line.unit,
                        lineValue: line.value,
                    },
                });
            }
        }

        return {
            contentType: transport.CONTENT_TYPE.TEXT,
            body: fw.composeMessage(records),
            headers: {
                'X-ABI-Filer-Code': cfg.filerCode,
                'X-ABI-Application': isIsf ? 'SF' : 'ES',
                'X-ABI-Environment': this.testMode ? 'CERT' : 'PROD',
            },
            meta: { message_type: this.messageType, record_count: records.length, test_mode: this.testMode },
        };
    }

    async transmit(payload, ctx = {}) {
        const cfg = ctx.cfg || this.assertConfigured();
        const res = await transport.transmit(this, {
            url: cfg.endpoint,
            headers: payload.headers,
            body: payload.body,
            contentType: payload.contentType,
            cfg,
        });
        return { ...res, payloadMeta: payload.meta };
    }

    async poll(gatewayReference, ctx = {}) {
        const cfg = ctx.cfg || this.assertConfigured();
        const url = new URL(cfg.statusEndpoint || cfg.endpoint);
        url.searchParams.set('filerCode', cfg.filerCode);
        url.searchParams.set('reference', String(gatewayReference));
        const res = await transport.transmit(this, {
            url: url.toString(), method: 'GET', cfg, contentType: transport.CONTENT_TYPE.TEXT,
        });
        return this.parseResponse(res, { ...ctx, cfg, polled: true });
    }

    parseResponse(raw) {
        const body = String(raw.body || '');
        const lines = body.split(/\r?\n/).filter((l) => l.trim() !== '');

        // Parsed through the layout table, not through hand-counted offsets — a
        // status code read one column short is a wrong customs status, and that
        // is not a class of bug worth risking to save a table.
        const RESPONSE_LAYOUTS = {
            [LAYOUTS.dispositionResponse.recordId]: LAYOUTS.dispositionResponse,
            [LAYOUTS.errorResponse.recordId]: LAYOUTS.errorResponse,
        };

        let disposition = null;
        let reference = null;
        const messages = [];

        for (const line of lines) {
            const recordId = line.slice(0, 2).trim();
            const layout = RESPONSE_LAYOUTS[recordId];
            if (!layout) continue;
            const parsed = fw.parseRecord(layout, line);

            if (layout === LAYOUTS.dispositionResponse) {
                disposition = (parsed.dispositionCode || disposition || '').toUpperCase() || null;
                reference = reference || parsed.referenceNumber || null;
            } else if (parsed.errorCode || parsed.errorText) {
                messages.push({
                    code: parsed.errorCode || 'ABI_ERROR',
                    level: 'error',
                    text: parsed.errorText || `ABI error ${parsed.errorCode}`,
                });
            }
        }

        if (!disposition && !messages.length && lines.length === 0) {
            throw this.failTransient('CBP returned an empty response body', {
                code: 'EMPTY_RESPONSE', raw: { http_status: raw.status },
            });
        }

        const native = disposition || 'RECEIVED';
        const status = ABI_STATUS[native] || STATUS.SUBMITTED;

        return this.normalize({
            status,
            accepted: status === STATUS.ACCEPTED,
            gateway_reference: reference,
            gateway_status: native,
            messages,
            retryable: false,
            raw: {
                http_status: raw.status,
                audit: raw.audit,
                payload_meta: raw.payloadMeta || null,
                records: lines.length,
                body: body.slice(0, 4000),
            },
        });
    }
}

module.exports = { USConnector, LAYOUTS, PARTY_TYPE, ABI_STATUS, MESSAGE_TYPE };
