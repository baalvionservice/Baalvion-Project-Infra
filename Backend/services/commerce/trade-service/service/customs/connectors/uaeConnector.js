'use strict';
/**
 * UAEConnector — Dubai Customs Mirsal 2 (real integration).
 *
 * Lodges an import, export or transit declaration as XML over mutual TLS,
 * authenticated additionally by the Dubai Trade integration account.
 *
 * The account credentials travel in the message header rather than as an HTTP
 * Authorization header, which is how the channel is specified — so they are
 * carried in the envelope below and never logged. Mutual TLS still authenticates
 * the connection; the account identifies the filing business.
 *
 * SPEC BINDING. Element names live in ELEMENTS and the declaration-type codes in
 * DECLARATION_TYPE — reconcile both against the Dubai Trade integration pack for
 * the version you are provisioned against.
 */

const { CustomsConnector } = require('./baseConnector');
const transport = require('./transport');
const xml = require('./xml');
const { CHANNEL, STATUS } = require('../schema');

const ELEMENTS = Object.freeze({
    envelope: 'MirsalDeclaration',
    header: 'Header',
    declaration: 'DeclarationDetails',
    invoice: 'InvoiceDetails',
    item: 'GoodsDetails',
});

/**
 * Mirsal declaration types. The right code decides duty treatment entirely —
 * a free-zone transfer assessed as an import would attract duty that is not due.
 */
const DECLARATION_TYPE = Object.freeze({
    IMPORT_FOR_HOME: '101',
    IMPORT_FOR_REEXPORT: '103',
    EXPORT: '201',
    FREE_ZONE_TRANSFER: '301',
    TRANSIT: '401',
});

const MIRSAL_STATUS = Object.freeze({
    SUBMITTED: STATUS.SUBMITTED,
    RECEIVED: STATUS.SUBMITTED,
    UNDER_PROCESSING: STATUS.SUBMITTED,
    PENDING_PAYMENT: STATUS.SUBMITTED,
    INSPECTION: STATUS.SUBMITTED,
    CLEARED: STATUS.ACCEPTED,
    APPROVED: STATUS.ACCEPTED,
    RELEASED: STATUS.ACCEPTED,
    REJECTED: STATUS.REJECTED,
    CANCELLED: STATUS.CANCELLED,
});

class UAEConnector extends CustomsConnector {
    constructor(opts = {}) {
        super({ channel: CHANNEL.UAE_MIRSAL, gatewayName: 'Mirsal 2', ...opts });
        this.messageVersion = opts.messageVersion || process.env.MIRSAL_MESSAGE_VERSION || '2.0';
    }

    validateDeclaration(declaration) {
        const errors = [];
        const meta = declaration.metadata || {};

        for (const line of declaration.line_items || []) {
            const hs = String(line.hs_code || '').replace(/\D/g, '');
            // The UAE applies the GCC common tariff at 8 digits.
            if (hs.length < 8) {
                errors.push({
                    code: 'AE_HS_TOO_SHORT',
                    level: 'error',
                    text: `Line ${line.line_no}: Mirsal assesses on the 8-digit GCC tariff code; "${line.hs_code}" has ${hs.length} digits`,
                });
            }
            if (!line.origin_country) {
                errors.push({ code: 'AE_MISSING_ORIGIN', level: 'error', text: `Line ${line.line_no}: country of origin is required` });
            }
            if (!Number(line.quantity)) {
                errors.push({ code: 'AE_MISSING_QUANTITY', level: 'error', text: `Line ${line.line_no}: quantity must be greater than zero` });
            }
        }

        if (!meta.declaration_type) {
            errors.push({
                code: 'AE_MISSING_DECLARATION_TYPE',
                level: 'error',
                text: `metadata.declaration_type is required (one of ${Object.values(DECLARATION_TYPE).join(', ')}). It decides duty treatment, so it cannot be defaulted.`,
            });
        } else if (!Object.values(DECLARATION_TYPE).includes(String(meta.declaration_type))) {
            errors.push({
                code: 'AE_BAD_DECLARATION_TYPE',
                level: 'error',
                text: `declaration_type "${meta.declaration_type}" is not a recognised Mirsal type`,
            });
        }
        if (!meta.total_packages) {
            errors.push({ code: 'AE_MISSING_PACKAGES', level: 'error', text: 'metadata.total_packages is required on a Mirsal declaration' });
        }

        return errors;
    }

    buildPayload(declaration, ctx = {}) {
        const cfg = ctx.cfg || {};
        const meta = declaration.metadata || {};

        const items = (declaration.line_items || []).map((line) => xml.el(ELEMENTS.item, {
            LineNumber: line.line_no,
            HSCode: String(line.hs_code || '').replace(/\D/g, ''),
            GoodsDescription: line.description,
            CountryOfOrigin: line.origin_country,
            Quantity: Number(line.quantity || 0).toFixed(3),
            UnitOfMeasure: line.unit,
            UnitPrice: Number(line.unit_value || 0).toFixed(2),
            LineValue: Number(line.value || 0).toFixed(2),
            NetWeight: line.net_weight_kg ? Number(line.net_weight_kg).toFixed(3) : null,
        }));

        const body = xml.build(xml.el(ELEMENTS.envelope, {
            children: [
                // Account credentials belong to the message, not to an HTTP
                // header, on this channel.
                xml.el(ELEMENTS.header, {
                    MessageVersion: this.messageVersion,
                    BusinessCode: cfg.businessCode,
                    UserName: cfg.username,
                    Password: cfg.password,
                    MessageId: ctx.idempotencyKey || null,
                    MessageDateTime: new Date().toISOString(),
                }),
                xml.el(ELEMENTS.declaration, {
                    DeclarationType: meta.declaration_type,
                    Regime: meta.regime || null,
                    PortOfEntry: meta.port_of_entry || null,
                    ImporterCode: cfg.businessCode,
                    ImporterName: (declaration.importer || {}).name,
                    ExporterName: (declaration.exporter || {}).name,
                    ExporterCountry: declaration.origin_country,
                    CountryOfDeparture: declaration.origin_country,
                    CountryOfDestination: declaration.destination_country,
                    TotalPackages: meta.total_packages,
                    PackageType: meta.package_type || null,
                    GrossWeight: meta.gross_mass_kg ? Number(meta.gross_mass_kg).toFixed(3) : null,
                    TransportMode: meta.transport_mode_code || null,
                    BillOfLadingNumber: meta.bill_of_lading_no || null,
                    Invoice: xml.el(ELEMENTS.invoice, {
                        InvoiceNumber: meta.invoice_no || null,
                        InvoiceDate: meta.invoice_date || null,
                        InvoiceCurrency: declaration.currency,
                        InvoiceValue: Number(declaration.customs_value || 0).toFixed(2),
                        IncoTerm: String(declaration.incoterm || '').toUpperCase() || null,
                        FreightAmount: meta.freight_amount ? Number(meta.freight_amount).toFixed(2) : null,
                        InsuranceAmount: meta.insurance_amount ? Number(meta.insurance_amount).toFixed(2) : null,
                    }),
                    Goods: items,
                }),
            ],
        }));

        return {
            contentType: transport.CONTENT_TYPE.XML,
            body,
            headers: { 'X-Mirsal-Business-Code': cfg.businessCode },
            meta: {
                message_version: this.messageVersion,
                declaration_type: meta.declaration_type,
                // Never echo the account password into audit metadata.
                credentials_in_envelope: true,
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
        url.searchParams.set('businessCode', cfg.businessCode);
        url.searchParams.set('declarationNumber', String(gatewayReference));
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
            throw this.failTransient(`Mirsal returned an unparseable response: ${err.message}`, {
                code: 'BAD_RESPONSE', raw: { body: String(raw.body || '').slice(0, 500) },
            });
        }

        const native = (xml.textAny(doc, ['Status', 'DeclarationStatus', 'StatusCode']) || 'SUBMITTED')
            .toUpperCase().replace(/\s+/g, '_');
        const status = MIRSAL_STATUS[native] || STATUS.SUBMITTED;

        const messages = xml.findAll(doc, 'Error').map((node) => ({
            code: xml.textAny(node, ['ErrorCode', 'Code']) || 'MIRSAL_ERROR',
            level: 'error',
            text: xml.textAny(node, ['ErrorDescription', 'Message', 'Description']) || node.text || 'Mirsal reported an error',
        }));

        return this.normalize({
            status,
            accepted: status === STATUS.ACCEPTED,
            gateway_reference: xml.textAny(doc, ['DeclarationNumber', 'DeclarationNo', 'CustomsDeclarationNumber', 'RequestNumber']),
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

module.exports = { UAEConnector, ELEMENTS, DECLARATION_TYPE, MIRSAL_STATUS };
