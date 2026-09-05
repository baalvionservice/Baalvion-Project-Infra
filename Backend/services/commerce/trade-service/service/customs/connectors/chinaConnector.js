'use strict';
/**
 * ChinaConnector — GACC / China International Trade Single Window (real integration).
 *
 * Lodges an import or export declaration as signed XML over mutual TLS.
 *
 * Message signing is REQUIRED here, not optional: GACC requires the declaration
 * to carry a signature from a certificate issued by an approved Chinese
 * certification authority, and an unsigned message is refused at the gateway.
 * The connector therefore treats missing signing material as a configuration
 * failure rather than degrading to an unsigned filing.
 *
 * TRADE MODE AND EXEMPTION NATURE are mandatory and consequential. They select
 * the customs regime — general trade, processing, bonded — and with it the duty
 * treatment. Defaulting them would file the wrong regime, which is a
 * misdeclaration rather than a formatting error, so they must be supplied.
 *
 * SPEC BINDING. Element names live in ELEMENTS; the trade-mode and exemption
 * codelists are GACC-published and versioned — reconcile both against the Single
 * Window integration pack you are provisioned against.
 */

const { CustomsConnector } = require('./baseConnector');
const transport = require('./transport');
const signing = require('./signing');
const xml = require('./xml');
const { CHANNEL, STATUS } = require('../schema');

const ELEMENTS = Object.freeze({
    envelope: 'DeclarationMessage',
    header: 'MessageHead',
    body: 'DeclarationHead',
    item: 'DeclarationList',
});

const DIRECTION_CODE = Object.freeze({ import: 'I', export: 'E' });

const GACC_STATUS = Object.freeze({
    SENT: STATUS.SUBMITTED,
    RECEIVED: STATUS.SUBMITTED,
    DECLARED: STATUS.SUBMITTED,
    UNDER_REVIEW: STATUS.SUBMITTED,
    INSPECTION: STATUS.SUBMITTED,
    TAX_PENDING: STATUS.SUBMITTED,
    RELEASED: STATUS.ACCEPTED,
    CLEARED: STATUS.ACCEPTED,
    PASSED: STATUS.ACCEPTED,
    RETURNED: STATUS.REJECTED,
    REJECTED: STATUS.REJECTED,
    CANCELLED: STATUS.CANCELLED,
});

class ChinaConnector extends CustomsConnector {
    constructor(opts = {}) {
        super({ channel: CHANNEL.CHINA_SINGLE_WINDOW, gatewayName: 'China Single Window', ...opts });
        this.messageVersion = opts.messageVersion || process.env.CHINA_SW_MESSAGE_VERSION || '1.0';
    }

    validateDeclaration(declaration) {
        const errors = [];
        const meta = declaration.metadata || {};

        for (const line of declaration.line_items || []) {
            const hs = String(line.hs_code || '').replace(/\D/g, '');
            // China assesses on the 10-digit national tariff line.
            if (hs.length < 10) {
                errors.push({
                    code: 'CN_HS_TOO_SHORT',
                    level: 'error',
                    text: `Line ${line.line_no}: GACC assesses on the 10-digit tariff line; "${line.hs_code}" has ${hs.length} digits`,
                });
            }
            if (!line.origin_country) {
                errors.push({ code: 'CN_MISSING_ORIGIN', level: 'error', text: `Line ${line.line_no}: country of origin is required` });
            }
            if (!line.unit) {
                errors.push({ code: 'CN_MISSING_UNIT', level: 'error', text: `Line ${line.line_no}: a declared unit of measure is required` });
            }
        }

        // Regime-selecting fields. Getting these wrong is a misdeclaration, not a
        // formatting problem, so neither is defaulted.
        if (!meta.trade_mode) {
            errors.push({ code: 'CN_MISSING_TRADE_MODE', level: 'error', text: 'metadata.trade_mode is required — it selects the customs regime (general, processing, bonded) and therefore the duty treatment' });
        }
        if (!meta.exemption_nature) {
            errors.push({ code: 'CN_MISSING_EXEMPTION_NATURE', level: 'error', text: 'metadata.exemption_nature is required — it declares the duty/tax exemption basis' });
        }
        if (!meta.transport_mode_code) {
            errors.push({ code: 'CN_MISSING_TRANSPORT_MODE', level: 'error', text: 'metadata.transport_mode_code is required on a GACC declaration' });
        }
        if (!meta.port_code) {
            errors.push({ code: 'CN_MISSING_PORT', level: 'error', text: 'metadata.port_code (the declaring customs district) is required' });
        }

        return errors;
    }

    buildPayload(declaration, ctx = {}) {
        const cfg = ctx.cfg || {};
        const meta = declaration.metadata || {};
        const isExport = declaration.entry_type === 'export';

        const items = (declaration.line_items || []).map((line) => xml.el(ELEMENTS.item, {
            GNo: line.line_no,
            CodeTS: String(line.hs_code || '').replace(/\D/g, ''),
            GName: line.description,
            OriginCountry: line.origin_country,
            GQty: Number(line.quantity || 0).toFixed(5),
            GUnit: line.unit,
            DeclPrice: Number(line.unit_value || 0).toFixed(4),
            DeclTotal: Number(line.value || 0).toFixed(2),
            TradeCurr: declaration.currency,
            DutyMode: meta.exemption_nature,
        }));

        const body = xml.build(xml.el(ELEMENTS.envelope, {
            children: [
                xml.el(ELEMENTS.header, {
                    MessageVersion: this.messageVersion,
                    MessageId: ctx.idempotencyKey || null,
                    MessageType: isExport ? 'EXP' : 'IMP',
                    SenderId: cfg.customsCode,
                    SendTime: new Date().toISOString(),
                }),
                xml.el(ELEMENTS.body, {
                    IEFlag: DIRECTION_CODE[declaration.entry_type] || 'I',
                    CustomMaster: meta.port_code,
                    TradeCode: cfg.customsCode,
                    TradeName: (isExport ? declaration.exporter : declaration.importer || {}).name,
                    AgentCode: cfg.declarantCode,
                    TradeMode: meta.trade_mode,
                    CutMode: meta.exemption_nature,
                    TrafMode: meta.transport_mode_code,
                    TrafName: meta.vessel_name || null,
                    BillNo: meta.bill_of_lading_no || null,
                    TradeCountry: isExport ? declaration.destination_country : declaration.origin_country,
                    DistinatePort: meta.port_of_discharge || null,
                    ContrNo: meta.contract_no || null,
                    PackNo: meta.total_packages || null,
                    GrossWt: meta.gross_mass_kg ? Number(meta.gross_mass_kg).toFixed(3) : null,
                    NetWt: meta.net_mass_kg ? Number(meta.net_mass_kg).toFixed(3) : null,
                    TransMode: String(declaration.incoterm || '').toUpperCase() || null,
                    FeeAmount: meta.freight_amount ? Number(meta.freight_amount).toFixed(2) : null,
                    InsurAmount: meta.insurance_amount ? Number(meta.insurance_amount).toFixed(2) : null,
                    DeclTotal: Number(declaration.customs_value || 0).toFixed(2),
                    Items: items,
                }),
            ],
        }));

        // Required, not optional — an unsigned GACC declaration is refused, so a
        // missing key must surface as a configuration failure rather than as a
        // filing that quietly goes out unsigned.
        if (!cfg.signingCertPath || !cfg.signingKeyPath) {
            throw this.failPermanent(
                'China Single Window requires a message signature; CHINA_SW_SIGNING_CERT and CHINA_SW_SIGNING_KEY are not configured. Nothing was transmitted.',
                { code: 'SIGNING_NOT_CONFIGURED' },
            );
        }
        const signature = signing.signDetachedCms(body, {
            certPath: cfg.signingCertPath,
            keyPath: cfg.signingKeyPath,
            passphrase: cfg.signingKeyPassphrase || null,
        });

        return {
            contentType: transport.CONTENT_TYPE.XML,
            body,
            headers: {
                'X-SW-Customs-Code': cfg.customsCode,
                'X-SW-Declarant-Code': cfg.declarantCode,
                'X-SW-Signature': signature.base64,
                'X-SW-Signature-Alg': 'CMS-SHA256-detached',
            },
            meta: {
                message_version: this.messageVersion,
                direction: DIRECTION_CODE[declaration.entry_type] || 'I',
                trade_mode: meta.trade_mode,
                signer: signature.signer,
                content_digest: signature.content_digest,
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
        url.searchParams.set('tradeCode', cfg.customsCode);
        url.searchParams.set('entryId', String(gatewayReference));
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
            throw this.failTransient(`Single Window returned an unparseable response: ${err.message}`, {
                code: 'BAD_RESPONSE', raw: { body: String(raw.body || '').slice(0, 500) },
            });
        }

        const native = (xml.textAny(doc, ['Status', 'DeclStatus', 'StatusCode', 'ResultCode']) || 'SENT')
            .toUpperCase().replace(/\s+/g, '_');
        const status = GACC_STATUS[native] || STATUS.SUBMITTED;

        const messages = xml.findAll(doc, 'Error').concat(xml.findAll(doc, 'Note')).map((node) => ({
            code: xml.textAny(node, ['ErrorCode', 'Code', 'ResultCode']) || 'GACC_ERROR',
            level: 'error',
            text: xml.textAny(node, ['ErrorMessage', 'Message', 'ResultMessage', 'Description']) || node.text || 'GACC reported an error',
        }));

        return this.normalize({
            status,
            accepted: status === STATUS.ACCEPTED,
            gateway_reference: xml.textAny(doc, ['EntryId', 'CusDeclNo', 'DeclNo', 'SeqNo']),
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

module.exports = { ChinaConnector, ELEMENTS, GACC_STATUS, DIRECTION_CODE };
