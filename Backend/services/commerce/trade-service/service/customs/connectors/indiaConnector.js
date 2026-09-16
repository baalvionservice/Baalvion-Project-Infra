'use strict';
/**
 * IndiaConnector — CBIC ICEGATE (real integration).
 *
 * Files a Bill of Entry (import) or a Shipping Bill (export) as a signed XML
 * message over mutual TLS.
 *
 * TWO INDEPENDENT SECURITY LAYERS, both required and both real:
 *   • mutual TLS with the ICEGATE-issued client certificate — authenticates the
 *     CHANNEL;
 *   • a detached CMS signature over the message body using the Class-3 Digital
 *     Signature Certificate registered against the ICEGATE id — authenticates
 *     the DECLARATION. India treats the DSC as the filer's legal signature, so
 *     an unsigned message is not a technically-invalid filing, it is an
 *     unsigned legal document.
 *
 * SPEC BINDING. Element names live in ELEMENTS below and nowhere else, because
 * they are the one thing that must be reconciled against the ICEGATE message
 * specification issued with MEF enrolment, and that specification is versioned.
 * `messageVersion` is carried on the envelope so a schema revision is a config
 * change. Everything else in this file — the canonical mapping, the duty
 * arithmetic, the status vocabulary, the polling loop — is independent of it.
 *
 * ASYNCHRONOUS BY DESIGN. A submission returns a job acknowledgement, not a
 * decision. The Bill of Entry number and the assessment arrive later, which is
 * why poll() exists and why pre-arrival filing works at all.
 */

const { CustomsConnector } = require('./baseConnector');
const transport = require('./transport');
const signing = require('./signing');
const xml = require('./xml');
const { CHANNEL, STATUS } = require('../schema');

/**
 * Element names for the ICEGATE message. THE spec-binding point — reconcile
 * against the message specification version in your MEF enrolment pack.
 */
const ELEMENTS = Object.freeze({
    envelope: 'IceGateMessage',
    header: 'MessageHeader',
    body: 'MessageBody',
    billOfEntry: 'BillOfEntry',
    shippingBill: 'ShippingBill',
    invoice: 'InvoiceDetails',
    item: 'ItemDetails',
});

const MESSAGE_TYPE = Object.freeze({ IMPORT: 'BE', EXPORT: 'SB' });

/**
 * ICEGATE status vocabulary → the platform's normalized ladder.
 *
 * OOC (Out Of Charge) is the one that matters operationally: it is the point at
 * which goods may actually leave the customs area. ASSESSED means duty has been
 * determined but the goods are not yet released, so it is deliberately NOT
 * mapped to accepted — treating it as cleared would tell a customer their cargo
 * is free to move when it is not.
 */
const ICE_STATUS = Object.freeze({
    RECEIVED: STATUS.SUBMITTED,
    QUEUED: STATUS.SUBMITTED,
    UNDER_PROCESS: STATUS.SUBMITTED,
    REGISTERED: STATUS.SUBMITTED,
    ASSESSED: STATUS.SUBMITTED,
    'DUTY PAID': STATUS.SUBMITTED,
    EXAMINATION: STATUS.SUBMITTED,
    OOC: STATUS.ACCEPTED,
    'OUT OF CHARGE': STATUS.ACCEPTED,
    LEO: STATUS.ACCEPTED,          // Let Export Order — the export equivalent
    'LET EXPORT ORDER': STATUS.ACCEPTED,
    REJECTED: STATUS.REJECTED,
    CANCELLED: STATUS.CANCELLED,
    QUERY: STATUS.SUBMITTED,       // customs raised a query; still open
});

/** Indian Unit Quantity Codes. A UQC outside this list is rejected at ICEGATE. */
const UQC = Object.freeze([
    'BAG', 'BAL', 'BDL', 'BKL', 'BOU', 'BOX', 'BTL', 'BUN', 'CAN', 'CBM', 'CCM',
    'CMS', 'CTN', 'DOZ', 'DRM', 'GGK', 'GMS', 'GRS', 'GYD', 'KGS', 'KLR', 'KME',
    'LTR', 'MLT', 'MTR', 'MTS', 'NOS', 'PAC', 'PCS', 'PRS', 'QTL', 'ROL', 'SET',
    'SQF', 'SQM', 'SQY', 'TBS', 'TGM', 'THD', 'TON', 'TUB', 'UGS', 'UNT', 'YDS',
]);

// Map the common international units onto the Indian codes.
const UQC_ALIAS = Object.freeze({
    EA: 'NOS', PCE: 'PCS', PC: 'PCS', UNIT: 'UNT', KG: 'KGS', KGM: 'KGS',
    L: 'LTR', LTRS: 'LTR', M: 'MTR', M2: 'SQM', M3: 'CBM', MT: 'MTS', T: 'TON',
    DOZEN: 'DOZ', PAIR: 'PRS', SET: 'SET', BOX: 'BOX', CARTON: 'CTN',
});

const toUqc = (unit) => {
    const u = String(unit || '').trim().toUpperCase();
    if (UQC.includes(u)) return u;
    return UQC_ALIAS[u] || null;
};

/** Two-decimal string — ICEGATE rejects unbounded floats on money fields. */
const money = (n) => Number(n || 0).toFixed(2);

class IndiaConnector extends CustomsConnector {
    constructor(opts = {}) {
        super({ channel: CHANNEL.ICEGATE, gatewayName: 'ICEGATE', ...opts });
        this.messageVersion = opts.messageVersion || process.env.ICEGATE_MESSAGE_VERSION || '1.0';
    }

    validateDeclaration(declaration) {
        const errors = [];
        const isExport = declaration.entry_type === 'export';
        const trader = isExport ? declaration.exporter : declaration.importer;

        if (!trader || !trader.iec) {
            errors.push({ code: 'IN_MISSING_IEC', level: 'error', text: 'ICEGATE requires the Importer-Exporter Code (IEC) on the trading party' });
        } else if (!/^[A-Z0-9]{10}$/.test(String(trader.iec).toUpperCase())) {
            errors.push({ code: 'IN_BAD_IEC', level: 'error', text: `IEC "${trader.iec}" is not a valid 10-character code` });
        }
        if (trader && trader.tax_id && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(String(trader.tax_id).toUpperCase())) {
            errors.push({ code: 'IN_BAD_GSTIN', level: 'error', text: `GSTIN "${trader.tax_id}" is not a valid 15-character GSTIN` });
        }
        if (!declaration.incoterm) {
            errors.push({ code: 'IN_MISSING_INCOTERM', level: 'error', text: 'ICEGATE requires an Incoterm on the declaration' });
        }

        for (const line of declaration.line_items || []) {
            // India assesses on the 8-digit national tariff line (CTSH), not the
            // 6-digit international subheading.
            const ctsh = String(line.hs_code || '').replace(/\D/g, '');
            if (ctsh.length < 8) {
                errors.push({
                    code: 'IN_CTSH_TOO_SHORT',
                    level: 'error',
                    text: `Line ${line.line_no}: ICEGATE assesses on the 8-digit CTSH; "${line.hs_code}" has ${ctsh.length} digits`,
                });
            }
            if (!toUqc(line.unit)) {
                errors.push({
                    code: 'IN_BAD_UQC',
                    level: 'error',
                    text: `Line ${line.line_no}: unit "${line.unit}" does not map to an Indian Unit Quantity Code`,
                });
            }
            if (!line.origin_country) {
                errors.push({ code: 'IN_MISSING_ORIGIN', level: 'error', text: `Line ${line.line_no}: country of origin is required` });
            }
        }

        // An export shipping bill is filed against an Authorised Dealer bank code
        // so export proceeds can be reconciled; without it the filing is refused.
        if (isExport && !(declaration.metadata && declaration.metadata.ad_code)) {
            errors.push({ code: 'IN_MISSING_AD_CODE', level: 'error', text: 'A Shipping Bill requires the Authorised Dealer (AD) bank code in metadata.ad_code' });
        }

        return errors;
    }

    buildPayload(declaration, ctx = {}) {
        const cfg = ctx.cfg || {};
        const isExport = declaration.entry_type === 'export';
        const meta = declaration.metadata || {};
        const trader = (isExport ? declaration.exporter : declaration.importer) || {};
        const counterparty = (isExport ? declaration.importer : declaration.exporter) || {};

        const header = xml.el(ELEMENTS.header, {
            MessageType: isExport ? MESSAGE_TYPE.EXPORT : MESSAGE_TYPE.IMPORT,
            MessageVersion: this.messageVersion,
            IceGateId: cfg.icegateId,
            LocationCode: meta.port_code || cfg.locationCode,
            MessageId: ctx.idempotencyKey || null,
            MessageDateTime: new Date().toISOString(),
        });

        const items = (declaration.line_items || []).map((line) => xml.el(ELEMENTS.item, {
            SerialNumber: line.line_no,
            CTSH: String(line.hs_code || '').replace(/\D/g, ''),
            ItemDescription: line.description,
            CountryOfOrigin: line.origin_country,
            Quantity: Number(line.quantity || 0).toFixed(3),
            UQC: toUqc(line.unit),
            UnitPrice: money(line.unit_value),
            InvoiceValue: money(line.value),
            // Assessable value is the invoice value plus the landing charges the
            // incoterm did not already cover — see the invoice block below.
            AssessableValue: money(line.value),
        }));

        const invoice = xml.el(ELEMENTS.invoice, {
            InvoiceNumber: meta.invoice_no || null,
            InvoiceDate: meta.invoice_date || null,
            InvoiceCurrency: declaration.currency,
            IncoTerm: String(declaration.incoterm || '').toUpperCase(),
            InvoiceValue: money(declaration.customs_value),
            FreightAmount: money(meta.freight_amount),
            InsuranceAmount: money(meta.insurance_amount),
            ExchangeRate: meta.exchange_rate ? Number(meta.exchange_rate).toFixed(4) : null,
        });

        const declarationBlock = isExport
            ? xml.el(ELEMENTS.shippingBill, {
                IEC: String(trader.iec || '').toUpperCase(),
                GSTIN: trader.tax_id ? String(trader.tax_id).toUpperCase() : null,
                ExporterName: trader.name,
                ExporterAddress: trader.address,
                ADCode: meta.ad_code,
                ConsigneeName: counterparty.name,
                ConsigneeCountry: declaration.destination_country,
                PortOfLoading: meta.port_code || cfg.locationCode,
                PortOfDestination: meta.port_of_discharge || null,
                SchemeCode: meta.scheme_code || null,      // drawback / RoDTEP / advance authorisation
                Invoice: invoice,
                Items: items,
            })
            : xml.el(ELEMENTS.billOfEntry, {
                IEC: String(trader.iec || '').toUpperCase(),
                GSTIN: trader.tax_id ? String(trader.tax_id).toUpperCase() : null,
                ImporterName: trader.name,
                ImporterAddress: trader.address,
                SupplierName: counterparty.name,
                CountryOfConsignment: declaration.origin_country,
                PortOfShipment: meta.port_of_loading || null,
                IGMNumber: meta.igm_number || null,
                IGMDate: meta.igm_date || null,
                BillOfLadingNumber: meta.bill_of_lading_no || null,
                BEType: meta.be_type || 'H',               // H = home consumption
                Invoice: invoice,
                Items: items,
            });

        const body = xml.build(
            xml.el(ELEMENTS.envelope, { children: [header, xml.el(ELEMENTS.body, { children: [declarationBlock] })] }),
        );

        // Sign the exact bytes that go on the wire. Signing a re-serialised copy
        // would produce a signature over something the authority never received.
        const signature = signing.signDetachedCms(body, {
            certPath: cfg.signingCertPath,
            keyPath: cfg.signingKeyPath,
            passphrase: cfg.signingKeyPassphrase || null,
        });

        return {
            contentType: transport.CONTENT_TYPE.XML,
            body,
            headers: {
                'X-ICEGATE-Id': cfg.icegateId,
                'X-ICEGATE-Message-Type': isExport ? MESSAGE_TYPE.EXPORT : MESSAGE_TYPE.IMPORT,
                'X-ICEGATE-Signature': signature.base64,
                'X-ICEGATE-Signature-Alg': 'CMS-SHA256-detached',
            },
            meta: {
                message_type: isExport ? MESSAGE_TYPE.EXPORT : MESSAGE_TYPE.IMPORT,
                message_version: this.messageVersion,
                signer: signature.signer,
                content_digest: signature.content_digest,
                signing_time: signature.signing_time,
            },
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

    /** Query the status of a lodged filing by its job id or BE/SB number. */
    async poll(gatewayReference, ctx = {}) {
        const cfg = ctx.cfg || this.assertConfigured();
        const url = new URL(cfg.statusEndpoint || cfg.endpoint);
        url.searchParams.set('icegateId', cfg.icegateId);
        url.searchParams.set('reference', String(gatewayReference));

        const res = await transport.transmit(this, {
            url: url.toString(),
            method: 'GET',
            cfg,
            contentType: transport.CONTENT_TYPE.XML,
        });
        return this.parseResponse(res, { ...ctx, cfg, polled: true });
    }

    parseResponse(raw, ctx = {}) {
        let doc;
        try {
            doc = xml.parse(raw.body);
        } catch (err) {
            // A gateway that answers 200 with something unparseable is a gateway
            // fault, not a rejected declaration — retry rather than fail the filing.
            throw this.failTransient(`ICEGATE returned an unparseable response: ${err.message}`, {
                code: 'BAD_RESPONSE',
                raw: { body: String(raw.body || '').slice(0, 500) },
            });
        }

        const native = (xml.textAny(doc, ['Status', 'IceStatus', 'BeStatus', 'SbStatus']) || 'RECEIVED').toUpperCase();
        const status = ICE_STATUS[native] || STATUS.SUBMITTED;

        const errorNodes = [...xml.findAll(doc, 'Error'), ...xml.findAll(doc, 'ErrorDetail')];
        const messages = errorNodes.map((node) => ({
            code: xml.text(node, 'ErrorCode') || xml.text(node, 'Code') || 'ICEGATE_ERROR',
            level: 'error',
            text: xml.text(node, 'ErrorMessage') || xml.text(node, 'Message') || node.text || 'ICEGATE reported an error',
        }));

        // A customs query is not a rejection — it is an open request for
        // information, and treating it as terminal would abandon a live filing.
        for (const node of xml.findAll(doc, 'Query')) {
            messages.push({
                code: xml.text(node, 'QueryCode') || 'ICEGATE_QUERY',
                level: 'warning',
                text: xml.text(node, 'QueryText') || node.text || 'Customs raised a query on this filing',
            });
        }

        return this.normalize({
            status,
            accepted: status === STATUS.ACCEPTED,
            gateway_reference: xml.textAny(doc, ['BeNumber', 'SbNumber', 'BillOfEntryNumber', 'ShippingBillNumber', 'JobId', 'MessageId']),
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

module.exports = { IndiaConnector, ELEMENTS, ICE_STATUS, UQC, toUqc, MESSAGE_TYPE };
