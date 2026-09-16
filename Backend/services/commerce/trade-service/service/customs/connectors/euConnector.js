'use strict';
/**
 * EUConnector — UCC declaration to a member-state customs system (real integration).
 *
 * There is no single European endpoint. A declaration is lodged with the member
 * state of declaration, each of which runs its own UCC-compliant system, so the
 * endpoint, the codelists and the message version are all member-state specific
 * and come from configuration rather than being inferred from the destination.
 * Treating "the EU" as one gateway is the mistake that makes an integration look
 * finished and then fail in the second country.
 *
 * MESSAGE TYPES
 *   H1   standard import declaration for release for free circulation
 *   B1   standard export declaration
 *   F10  entry summary declaration (ICS2), the safety-and-security filing whose
 *        deadline runs from LADING, not arrival
 *
 * SPEC BINDING. Element names and the namespace live in ELEMENTS/NAMESPACE below.
 * The UCC data model is versioned per member state and per release phase, so
 * `messageVersion` and the namespace are configuration, not constants.
 */

const { CustomsConnector } = require('./baseConnector');
const transport = require('./transport');
const signing = require('./signing');
const xml = require('./xml');
const { CHANNEL, STATUS } = require('../schema');

const NAMESPACE_ENV = 'EU_CDS_NAMESPACE';

const ELEMENTS = Object.freeze({
    envelope: 'Declaration',
    goodsShipment: 'GoodsShipment',
    governmentAgencyGoodsItem: 'GovernmentAgencyGoodsItem',
    commodity: 'Commodity',
    consignment: 'Consignment',
});

const MESSAGE_TYPE = Object.freeze({ IMPORT: 'H1', EXPORT: 'B1', ENS: 'F10' });

/**
 * UCC declaration states → the normalized ladder.
 *
 * "Accepted" in UCC terms means the declaration was ACCEPTED FOR PROCESSING, not
 * that goods are released. Only release actually frees the cargo, so acceptance
 * is mapped to `submitted` — reporting it as cleared would be wrong at exactly
 * the moment a customer acts on it.
 */
const UCC_STATUS = Object.freeze({
    RECEIVED: STATUS.SUBMITTED,
    ACCEPTED: STATUS.SUBMITTED,
    UNDER_CONTROL: STATUS.SUBMITTED,
    CONTROL: STATUS.SUBMITTED,
    RELEASED: STATUS.ACCEPTED,
    RELEASE: STATUS.ACCEPTED,
    CLEARED: STATUS.ACCEPTED,
    REJECTED: STATUS.REJECTED,
    NOT_ACCEPTED: STATUS.REJECTED,
    INVALIDATED: STATUS.CANCELLED,
    CANCELLED: STATUS.CANCELLED,
});

const EORI_PATTERN = /^[A-Z]{2}[A-Z0-9]{1,15}$/;

class EUConnector extends CustomsConnector {
    constructor(opts = {}) {
        super({ channel: CHANNEL.EU_CDS, gatewayName: 'EU customs', ...opts });
        this.messageType = opts.messageType || MESSAGE_TYPE.IMPORT;
        this.messageVersion = opts.messageVersion || process.env.EU_CDS_MESSAGE_VERSION || '1.0';
        this.namespace = opts.namespace || process.env[NAMESPACE_ENV] || null;
    }

    validateDeclaration(declaration) {
        const errors = [];
        const isExport = declaration.entry_type === 'export';
        const trader = (isExport ? declaration.exporter : declaration.importer) || {};
        const meta = declaration.metadata || {};

        const eori = trader.eori || trader.tax_id;
        if (!eori) {
            errors.push({ code: 'EU_MISSING_EORI', level: 'error', text: 'A UCC declaration is filed against the declarant EORI number' });
        } else if (!EORI_PATTERN.test(String(eori).toUpperCase())) {
            errors.push({ code: 'EU_BAD_EORI', level: 'error', text: `EORI "${eori}" is not valid: two-letter country code followed by up to 15 alphanumeric characters` });
        }

        for (const line of declaration.line_items || []) {
            const code = String(line.hs_code || '').replace(/\D/g, '');
            // Import is assessed on the 10-digit TARIC line; export uses the
            // 8-digit Combined Nomenclature code.
            const required = isExport ? 8 : 10;
            if (code.length < required) {
                errors.push({
                    code: 'EU_COMMODITY_CODE_TOO_SHORT',
                    level: 'error',
                    text: `Line ${line.line_no}: a${isExport ? 'n export' : 'n import'} declaration needs the ${required}-digit ${isExport ? 'CN' : 'TARIC'} code; "${line.hs_code}" has ${code.length} digits`,
                });
            }
            if (!line.origin_country) {
                errors.push({ code: 'EU_MISSING_ORIGIN', level: 'error', text: `Line ${line.line_no}: country of origin is required` });
            }
        }

        // The requested and previous procedure codes decide the customs
        // treatment; without them the declaration cannot be assessed at all.
        if (!meta.procedure_code) {
            errors.push({ code: 'EU_MISSING_PROCEDURE_CODE', level: 'error', text: 'metadata.procedure_code is required (the four-digit requested/previous procedure pair, e.g. 4000)' });
        }
        if (!isExport && !meta.valuation_method) {
            errors.push({ code: 'EU_MISSING_VALUATION_METHOD', level: 'warning', text: 'metadata.valuation_method is not set; transaction value (method 1) will be assumed' });
        }

        return errors;
    }

    buildPayload(declaration, ctx = {}) {
        const cfg = ctx.cfg || {};
        const meta = declaration.metadata || {};
        const isExport = declaration.entry_type === 'export';
        const trader = (isExport ? declaration.exporter : declaration.importer) || {};
        const counterparty = (isExport ? declaration.importer : declaration.exporter) || {};
        const declarantEori = String(trader.eori || trader.tax_id || cfg.eori || '').toUpperCase();

        const items = (declaration.line_items || []).map((line) => xml.el(ELEMENTS.governmentAgencyGoodsItem, {
            SequenceNumeric: line.line_no,
            Commodity: xml.el(ELEMENTS.commodity, {
                Description: line.description,
                CommodityCode: String(line.hs_code || '').replace(/\D/g, ''),
                GrossMassMeasure: meta.gross_mass_kg ? Number(meta.gross_mass_kg).toFixed(3) : null,
                NetMassMeasure: line.net_weight_kg ? Number(line.net_weight_kg).toFixed(3) : null,
            }),
            OriginCountryCode: line.origin_country,
            GoodsMeasure: xml.el('GoodsMeasure', {
                TariffQuantity: Number(line.quantity || 0).toFixed(3),
                MeasurementUnitCode: line.unit,
            }),
            StatisticalValueAmount: Number(line.value || 0).toFixed(2),
            ProcedureCode: meta.procedure_code,
        }));

        const goodsShipment = xml.el(ELEMENTS.goodsShipment, {
            TransactionNatureCode: meta.transaction_nature || '11',
            Consignor: xml.el('Consignor', {
                Name: isExport ? trader.name : counterparty.name,
                CountryCode: declaration.origin_country,
                Identifier: isExport ? declarantEori : null,
            }),
            Consignee: xml.el('Consignee', {
                Name: isExport ? counterparty.name : trader.name,
                CountryCode: declaration.destination_country,
                Identifier: isExport ? null : declarantEori,
            }),
            Consignment: xml.el(ELEMENTS.consignment, {
                ContainerCode: (meta.container_numbers || []).length ? '1' : '0',
                ArrivalTransportMeans: xml.el('ArrivalTransportMeans', {
                    Identification: meta.vessel_name || null,
                    ModeCode: meta.transport_mode_code || null,
                }),
                TransportEquipment: (meta.container_numbers || []).map((cn) => xml.el('TransportEquipment', { EquipmentIdentification: cn })),
            }),
            CustomsValuation: xml.el('CustomsValuation', {
                MethodCode: meta.valuation_method || '1',
                InvoiceAmount: Number(declaration.customs_value || 0).toFixed(2),
                InvoiceCurrencyCode: declaration.currency,
                FreightAmount: meta.freight_amount ? Number(meta.freight_amount).toFixed(2) : null,
                InsuranceAmount: meta.insurance_amount ? Number(meta.insurance_amount).toFixed(2) : null,
            }),
            GovernmentAgencyGoodsItems: items,
        });

        const envelopeAttrs = this.namespace ? { xmlns: this.namespace } : {};
        const body = xml.build(xml.el(ELEMENTS.envelope, {
            FunctionCode: meta.function_code || '9',
            TypeCode: this.messageType,
            MessageVersion: this.messageVersion,
            DeclarationOfficeId: meta.customs_office || null,
            MemberStateOfDeclaration: cfg.memberState,
            Declarant: xml.el('Declarant', { Identifier: declarantEori, Name: trader.name }),
            GoodsShipment: goodsShipment,
        }, envelopeAttrs));

        // Message-level signing where the member state requires it in addition
        // to mutual TLS. Several do not, so this is conditional on config rather
        // than assumed either way.
        let signature = null;
        if (cfg.signingCertPath && cfg.signingKeyPath) {
            signature = signing.signDetachedCms(body, {
                certPath: cfg.signingCertPath,
                keyPath: cfg.signingKeyPath,
                passphrase: cfg.signingKeyPassphrase || null,
            });
        }

        return {
            contentType: transport.CONTENT_TYPE.XML,
            body,
            headers: {
                'X-Declarant-EORI': declarantEori,
                'X-Member-State': cfg.memberState,
                'X-Declaration-Type': this.messageType,
                ...(signature ? { 'X-Message-Signature': signature.base64, 'X-Message-Signature-Alg': 'CMS-SHA256-detached' } : {}),
            },
            meta: {
                message_type: this.messageType,
                message_version: this.messageVersion,
                member_state: cfg.memberState,
                signed: !!signature,
                signer: signature ? signature.signer : null,
            },
        };
    }

    async transmit(payload, ctx = {}) {
        const cfg = ctx.cfg || this.assertConfigured();
        const res = await transport.transmit(this, {
            url: cfg.endpoint, headers: payload.headers, body: payload.body,
            contentType: payload.contentType, cfg,
        });
        return { ...res, payloadMeta: payload.meta };
    }

    async poll(gatewayReference, ctx = {}) {
        const cfg = ctx.cfg || this.assertConfigured();
        const url = new URL(cfg.statusEndpoint || cfg.endpoint);
        url.searchParams.set('mrn', String(gatewayReference));
        const res = await transport.transmit(this, {
            url: url.toString(), method: 'GET', cfg, contentType: transport.CONTENT_TYPE.XML,
        });
        return this.parseResponse(res, { ...ctx, cfg, polled: true });
    }

    parseResponse(raw) {
        let doc;
        try {
            doc = xml.parse(raw.body);
        } catch (err) {
            throw this.failTransient(`member-state system returned an unparseable response: ${err.message}`, {
                code: 'BAD_RESPONSE', raw: { body: String(raw.body || '').slice(0, 500) },
            });
        }

        const native = (xml.textAny(doc, ['Status', 'DeclarationStatus', 'StatusCode', 'FunctionCode']) || 'RECEIVED')
            .toUpperCase().replace(/\s+/g, '_');
        const status = UCC_STATUS[native] || STATUS.SUBMITTED;

        const messages = xml.findAll(doc, 'Error').concat(xml.findAll(doc, 'ValidationError')).map((node) => ({
            code: xml.textAny(node, ['ErrorCode', 'Code', 'ValidationCode']) || 'EU_ERROR',
            level: 'error',
            text: xml.textAny(node, ['ErrorMessage', 'Description', 'Text']) || node.text || 'Member-state system reported an error',
        }));

        return this.normalize({
            status,
            accepted: status === STATUS.ACCEPTED,
            // The MRN (Movement Reference Number) is the identifier every EU
            // customs interaction is keyed on afterwards.
            gateway_reference: xml.textAny(doc, ['MRN', 'MovementReferenceNumber', 'DeclarationId', 'LRN']),
            gateway_status: native,
            messages,
            retryable: false,
            raw: {
                http_status: raw.status,
                audit: raw.audit,
                payload_meta: raw.payloadMeta || null,
                document: xml.toObject(doc),
            },
        });
    }
}

module.exports = { EUConnector, ELEMENTS, UCC_STATUS, MESSAGE_TYPE };
