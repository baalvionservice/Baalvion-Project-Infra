'use strict';
/**
 * ============================================================================
 * SWIFT / ISO 20022 credit-transfer adapter — pain.001 build + pain.002 parse
 * ============================================================================
 * WHAT IS REAL HERE: the ISO 20022 message construction and status parsing.
 *   - initiate() builds a SCHEMA-VALID pain.001.001.09
 *     (CustomerCreditTransferInitiation) from the PaymentInitiateRequest.
 *   - getStatus() parses a pain.002 (CustomerPaymentStatusReport) or camt.054
 *     status code into a normalized PAYMENT_STATUS.
 *
 * WHAT IS A SEAM (credentials/spec, NOT mockable in-repo): the actual transport
 * that delivers the pain.001 to the bank and pulls the pain.002 back. That path
 * is BANK-SPECIFIC — host-to-host (SFTP/AS2 with PGP), a SWIFT service bureau,
 * or the bank's proprietary REST/SOAP API — and requires the bank to provide the
 * host-to-host spec, mTLS / PGP certs, and onboarding. We model it as a pluggable
 * `BankTransport`; the default `throwingBankTransport` throws
 * IntegrationRequiredError until a real bank transport is wired and certified.
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   SWIFT_BANK_TRANSPORT    impl id selecting a registered BankTransport (else throws)
 *   SWIFT_DEBTOR_IBAN       our (debtor) account IBAN
 *   SWIFT_DEBTOR_BIC        our (debtor) bank BIC / SWIFT code
 *   SWIFT_DEBTOR_NAME       (optional) registered debtor name on the account
 *   SWIFT_ENDPOINT          (transport-specific) host-to-host endpoint / bureau URL
 *   SWIFT_CLIENT_CERT       (transport-specific) mTLS client cert / path
 *   SWIFT_CLIENT_KEY        (transport-specific) mTLS client key / path
 *   SWIFT_PGP_KEY           (transport-specific) PGP key for payload encryption
 *
 * Posture: FAIL-CLOSED. submit() is a money instruction and is not retried by us;
 * settlement is asynchronous (ACSC/ACCC arrives later) and is resolved via
 * getStatus()/camt webhook keyed by the SAME idempotencyKey (MsgId / EndToEndId).
 */
const { env: defaultEnv } = require('../../_shared/config');
const { IntegrationRequiredError } = require('../../IntegrationRequiredError');
const { PAYMENT_STATUS, PAYMENT_RAIL } = require('../contract');

const REQUIRED = ['SWIFT_BANK_TRANSPORT', 'SWIFT_DEBTOR_IBAN', 'SWIFT_DEBTOR_BIC'];
const META = {
    domain: 'payment',
    vendorOptions: ['SWIFT host-to-host', 'SWIFT service bureau', 'bank ISO 20022 channel'],
};

/**
 * ISO 20022 pain.002 transaction status codes -> normalized PAYMENT_STATUS.
 * (Also accepts camt.054 / common settlement codes.)
 *   ACCP AcceptedCustomerProfile
 *   ACTC AcceptedTechnicalValidation
 *   ACSP AcceptedSettlementInProcess
 *   ACSC AcceptedSettlementCompleted (debtor side settled)
 *   ACCC AcceptedCreditSettlementCompleted (creditor credited) -> terminal success
 *   PDNG Pending — INTENTIONALLY mapped to PROCESSING (the instruction is accepted
 *        and in-flight at the bank, not a fresh/queued state), so the order saga
 *        keeps treating it as a non-terminal in-progress payment.
 *   RJCT Rejected -> terminal failure
 *   CANC Cancelled -> terminal cancel
 */
const STATUS_MAP = Object.freeze({
    ACCP: PAYMENT_STATUS.PENDING,
    ACTC: PAYMENT_STATUS.PROCESSING,
    ACSP: PAYMENT_STATUS.PROCESSING,
    ACSC: PAYMENT_STATUS.COMPLETED,
    ACCC: PAYMENT_STATUS.COMPLETED,
    PDNG: PAYMENT_STATUS.PROCESSING,
    RJCT: PAYMENT_STATUS.FAILED,
    CANC: PAYMENT_STATUS.CANCELLED,
});

/** @param {string} code @returns {keyof typeof PAYMENT_STATUS} */
function mapStatusCode(code) {
    return STATUS_MAP[String(code || '').toUpperCase().trim()] || PAYMENT_STATUS.PROCESSING;
}

/** XML-escape text node content. */
function xmlEscape(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * ISO 9362 BIC format: 6 letters (bank+country) + 1 location char + optional
 * 3-char branch. Excludes the reserved 'O'/'I'/'1'/'0' ambiguities in the
 * location char per the spec ([A-NP-Z2-9]). Branch is 0 or 3 alphanumerics.
 */
const BIC_RE = /^[A-Z]{6}[A-Z2-9][A-NP-Z0-9]([A-Z0-9]{3})?$/;

/**
 * Validate a BIC at message-build time. FAIL-CLOSED: an invalid BIC throws a
 * typed error BEFORE the pain.001 is built/submitted, so we never hand the bank
 * a malformed SWIFT code (which would be rejected downstream after money intent).
 * @param {string} bic
 * @param {string} field  which field for the error message (creditorBic/debtorBic)
 */
function assertValidBic(bic, field) {
    if (!BIC_RE.test(String(bic || '').toUpperCase())) {
        const err = new Error(`swift: invalid ${field} BIC '${bic}'`);
        err.code = 'INVALID_BIC';
        throw err;
    }
}

/** ISO 20022 wants amounts with a decimal point and up to 2 fraction digits. */
function formatAmount(amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        const err = new Error(`swift: invalid amount ${amount}`);
        err.code = 'INVALID_AMOUNT';
        throw err;
    }
    return amount.toFixed(2);
}

/**
 * Build a pain.001.001.09 CustomerCreditTransferInitiation XML.
 * MsgId / PmtInfId / EndToEndId all carry the idempotencyKey so the bank's
 * pain.002 can be reconciled back to the originating payment with no fresh key.
 * @param {import('../contract').PaymentInitiateRequest} req
 * @param {{ debtorIban:string, debtorBic:string, debtorName?:string, creationDateTime?:string }} ctx
 * @returns {string} pain.001 XML
 */
function buildPain001(req, ctx) {
    if (!req || !req.idempotencyKey) throw new Error('idempotencyKey required');
    if (!req.destinationAccountId) {
        const err = new Error('swift: destinationAccountId (creditor IBAN) required');
        err.code = 'MISSING_CREDITOR';
        throw err;
    }
    const msgId = req.idempotencyKey;
    const ccy = String(req.currency || '').toUpperCase();
    const amt = formatAmount(req.amount);
    const created = ctx.creationDateTime || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const debtorName = ctx.debtorName || 'GTI Treasury';
    const creditorName = (req.metadata && req.metadata.creditorName) || 'Beneficiary';
    const creditorBic = (req.metadata && req.metadata.creditorBic) || '';

    // Fail-closed BIC validation BEFORE the message is built / submitted.
    assertValidBic(ctx.debtorBic, 'debtorBic');
    if (creditorBic) assertValidBic(creditorBic, 'creditorBic');

    const creditorAgent = creditorBic
        ? `\n          <CdtrAgt><FinInstnId><BICFI>${xmlEscape(creditorBic)}</BICFI></FinInstnId></CdtrAgt>`
        : '';

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">',
        '  <CstmrCdtTrfInitn>',
        '    <GrpHdr>',
        `      <MsgId>${xmlEscape(msgId)}</MsgId>`,
        `      <CreDtTm>${xmlEscape(created)}</CreDtTm>`,
        '      <NbOfTxs>1</NbOfTxs>',
        `      <CtrlSum>${amt}</CtrlSum>`,
        '      <InitgPty>',
        `        <Nm>${xmlEscape(debtorName)}</Nm>`,
        '      </InitgPty>',
        '    </GrpHdr>',
        '    <PmtInf>',
        `      <PmtInfId>${xmlEscape(msgId)}</PmtInfId>`,
        '      <PmtMtd>TRF</PmtMtd>',
        '      <NbOfTxs>1</NbOfTxs>',
        `      <CtrlSum>${amt}</CtrlSum>`,
        '      <PmtTpInf><SvcLvl><Cd>SDVA</Cd></SvcLvl></PmtTpInf>',
        `      <ReqdExctnDt><Dt>${created.slice(0, 10)}</Dt></ReqdExctnDt>`,
        '      <Dbtr>',
        `        <Nm>${xmlEscape(debtorName)}</Nm>`,
        '      </Dbtr>',
        '      <DbtrAcct>',
        `        <Id><IBAN>${xmlEscape(ctx.debtorIban)}</IBAN></Id>`,
        '      </DbtrAcct>',
        '      <DbtrAgt>',
        `        <FinInstnId><BICFI>${xmlEscape(ctx.debtorBic)}</BICFI></FinInstnId>`,
        '      </DbtrAgt>',
        '      <ChrgBr>SHAR</ChrgBr>',
        '      <CdtTrfTxInf>',
        '        <PmtId>',
        `          <InstrId>${xmlEscape(msgId)}</InstrId>`,
        `          <EndToEndId>${xmlEscape(msgId)}</EndToEndId>`,
        '        </PmtId>',
        `        <Amt><InstdAmt Ccy="${xmlEscape(ccy)}">${amt}</InstdAmt></Amt>${creditorAgent}`,
        '        <Cdtr>',
        `          <Nm>${xmlEscape(creditorName)}</Nm>`,
        '        </Cdtr>',
        '        <CdtrAcct>',
        `          <Id><IBAN>${xmlEscape(req.destinationAccountId)}</IBAN></Id>`,
        '        </CdtrAcct>',
        '      </CdtTrfTxInf>',
        '    </PmtInf>',
        '  </CstmrCdtTrfInitn>',
        '</Document>',
    ].join('\n');
}

/**
 * Parse a pain.002 / camt.054 status XML into a status code + optional reason.
 * Tolerant (no XML lib): reads the first TxSts/GrpSts code and any StsRsnInf.
 * @param {string} xml
 * @returns {{ statusCode:string, status:keyof typeof PAYMENT_STATUS, reason?:string, providerRef?:string }}
 */
function parsePain002(xml) {
    const text = String(xml || '');
    const grab = (tag) => {
        const m = text.match(new RegExp(`<(?:\\w+:)?${tag}>\\s*([^<]+?)\\s*</(?:\\w+:)?${tag}>`, 'i'));
        return m ? m[1].trim() : undefined;
    };
    // Prefer transaction-level status, fall back to group/payment-level.
    const statusCode = grab('TxSts') || grab('GrpSts') || grab('PmtInfSts') || '';
    const status = mapStatusCode(statusCode);
    const out = { statusCode, status };
    const reason = grab('AddtlInf') || grab('Prtry');
    const rsnCd = grab('Cd');
    if (status === PAYMENT_STATUS.FAILED) out.reason = reason || rsnCd || statusCode || 'RJCT';
    const ref = grab('OrgnlEndToEndId') || grab('OrgnlInstrId') || grab('OrgnlMsgId');
    if (ref) out.providerRef = ref;
    return out;
}

/**
 * BankTransport interface:
 *   submit(pain001Xml, ctx) -> Promise<{ providerRef:string, statusXml?:string }>
 *   fetchStatus(providerRef, ctx) -> Promise<string>   // returns pain.002/camt XML
 * Real implementations wrap a bank's host-to-host channel; they are wired by id
 * via SWIFT_BANK_TRANSPORT and registered with `createSwiftProvider({ transport })`.
 */
const throwingBankTransport = {
    id: 'throwing',
    async submit() {
        throw new IntegrationRequiredError(
            'SWIFT bank transport not configured — the bank must provide the host-to-host spec + certs',
            META,
        );
    },
    async fetchStatus() {
        throw new IntegrationRequiredError(
            'SWIFT bank transport not configured — cannot fetch pain.002 status',
            META,
        );
    },
};

/**
 * @param {{
 *   env?: (name:string)=>string,
 *   transport?: { submit:Function, fetchStatus:Function, id?:string },
 *   now?: ()=>Date,
 * }} [deps]
 * @returns {import('../contract').PaymentProvider & { IS_CONFIGURED:boolean, buildPain001:Function }}
 */
function createSwiftProvider(deps = {}) {
    const env = deps.env ? (name) => deps.env(name) : (name) => defaultEnv(name);
    const transport = deps.transport || throwingBankTransport;
    const now = deps.now || (() => new Date());
    const configured = REQUIRED.every((n) => env(n) !== undefined) && transport.id !== 'throwing';

    function debtorCtx() {
        const debtorIban = env('SWIFT_DEBTOR_IBAN');
        const debtorBic = env('SWIFT_DEBTOR_BIC');
        if (!debtorIban || !debtorBic || !env('SWIFT_BANK_TRANSPORT')) {
            throw new IntegrationRequiredError(
                `SWIFT not configured (missing ${REQUIRED.filter((n) => !env(n)).join(', ')})`,
                META,
            );
        }
        return {
            debtorIban,
            debtorBic,
            debtorName: env('SWIFT_DEBTOR_NAME'),
            creationDateTime: now().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        };
    }

    function toResult(req, statusCode, providerRef, reason) {
        const status = mapStatusCode(statusCode);
        const result = {
            id: providerRef || (req && req.idempotencyKey),
            idempotencyKey: req && req.idempotencyKey,
            status,
            amount: req && req.amount,
            currency: req && req.currency,
            rail: PAYMENT_RAIL.SWIFT,
            providerRef: providerRef || (req && req.idempotencyKey),
        };
        if (status === PAYMENT_STATUS.FAILED) result.failureReason = reason || statusCode || 'RJCT';
        return result;
    }

    return {
        name: 'swift-iso20022',
        IS_PRODUCTION_SAFE: true,
        IS_CONFIGURED: configured,
        buildPain001,

        async initiate(req) {
            if (!req || !req.idempotencyKey) throw new Error('idempotencyKey required');
            const ctx = debtorCtx(); // throws IntegrationRequiredError if unconfigured
            const xml = buildPain001(req, ctx);
            // submit() may throw IntegrationRequiredError (default transport) or a
            // transport error; on timeout the caller reconciles via getStatus.
            const { providerRef, statusXml } = await transport.submit(xml, { req, idempotencyKey: req.idempotencyKey });
            let statusCode = 'ACTC'; // accepted technical validation by default once submitted
            let reason;
            if (statusXml) {
                const parsed = parsePain002(statusXml);
                statusCode = parsed.statusCode || statusCode;
                reason = parsed.reason;
            }
            return toResult(req, statusCode, providerRef, reason);
        },

        async getStatus(id) {
            if (!id) throw new Error('providerRef required');
            const statusXml = await transport.fetchStatus(id, {});
            const parsed = parsePain002(statusXml);
            return toResult({ idempotencyKey: parsed.providerRef || id }, parsed.statusCode, id, parsed.reason);
        },

        async cancel(id) {
            // SWIFT recalls (camt.056 FIToFIPaymentCancellationRequest) are a
            // separate, bank-mediated flow and not auto-executable here.
            throw new IntegrationRequiredError(
                'SWIFT payment cancellation requires a bank-mediated recall (camt.056)',
                META,
            );
        },
    };
}

module.exports = {
    createSwiftProvider,
    buildPain001,
    parsePain002,
    mapStatusCode,
    throwingBankTransport,
    STATUS_MAP,
    REQUIRED,
    formatAmount,
    assertValidBic,
    BIC_RE,
};
