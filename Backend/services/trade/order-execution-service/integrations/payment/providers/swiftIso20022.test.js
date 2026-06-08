'use strict';
const {
    createSwiftProvider,
    buildPain001,
    parsePain002,
    mapStatusCode,
    throwingBankTransport,
} = require('./swiftIso20022');
const { PAYMENT_STATUS, PAYMENT_RAIL } = require('../contract');
const { IntegrationRequiredError } = require('../../IntegrationRequiredError');

const ENV = {
    SWIFT_BANK_TRANSPORT: 'host2host',
    SWIFT_DEBTOR_IBAN: 'DE89370400440532013000',
    SWIFT_DEBTOR_BIC: 'COBADEFFXXX',
    SWIFT_DEBTOR_NAME: 'GTI Treasury',
};
const envFn = (map) => (name) => map[name];

const baseReq = (over = {}) => ({
    idempotencyKey: 'msg-id-001',
    sourceAccountId: 'acct-src',
    destinationAccountId: 'FR1420041010050500013M02606',
    amount: 1917.5,
    currency: 'EUR',
    paymentScheme: 'SWIFT',
    metadata: { creditorName: 'ACME SARL', creditorBic: 'BNPAFRPPXXX' },
    ...over,
});

describe('swift — pain.001 construction', () => {
    test('builds valid pain.001.001.09 with MsgId, amount + currency', () => {
        const xml = buildPain001(baseReq(), { debtorIban: ENV.SWIFT_DEBTOR_IBAN, debtorBic: ENV.SWIFT_DEBTOR_BIC });
        expect(xml).toContain('urn:iso:std:iso:20022:tech:xsd:pain.001.001.09');
        expect(xml).toContain('<MsgId>msg-id-001</MsgId>');
        expect(xml).toContain('<EndToEndId>msg-id-001</EndToEndId>');
        expect(xml).toContain('<InstdAmt Ccy="EUR">1917.50</InstdAmt>');
        expect(xml).toContain('<CtrlSum>1917.50</CtrlSum>');
        expect(xml).toContain(`<IBAN>${ENV.SWIFT_DEBTOR_IBAN}</IBAN>`);
        expect(xml).toContain('<IBAN>FR1420041010050500013M02606</IBAN>');
        expect(xml).toContain('<BICFI>BNPAFRPPXXX</BICFI>'); // creditor agent
        expect(xml).toContain('<Nm>ACME SARL</Nm>');
    });

    test('rejects missing creditor IBAN', () => {
        expect(() => buildPain001(baseReq({ destinationAccountId: '' }), { debtorIban: 'x', debtorBic: 'y' }))
            .toThrow(/creditor/i);
    });

    test('formats amount with 2 decimals', () => {
        const xml = buildPain001(baseReq({ amount: 1000 }), { debtorIban: 'x', debtorBic: ENV.SWIFT_DEBTOR_BIC });
        expect(xml).toContain('Ccy="EUR">1000.00<');
    });

    test('rejects an invalid debtor BIC (fail-closed before submission)', () => {
        expect(() => buildPain001(baseReq(), { debtorIban: 'x', debtorBic: 'NOTABIC' }))
            .toThrow(/invalid.*BIC/i);
    });

    test('rejects an invalid creditor BIC supplied via metadata', () => {
        expect(() => buildPain001(
            baseReq({ metadata: { creditorName: 'ACME', creditorBic: 'bad!' } }),
            { debtorIban: ENV.SWIFT_DEBTOR_IBAN, debtorBic: ENV.SWIFT_DEBTOR_BIC },
        )).toThrow(/invalid creditorBic/i);
    });

    test('accepts a valid 8-char BIC (no branch code)', () => {
        const xml = buildPain001(
            baseReq({ metadata: { creditorName: 'ACME', creditorBic: 'BNPAFRPP' } }),
            { debtorIban: ENV.SWIFT_DEBTOR_IBAN, debtorBic: 'COBADEFF' },
        );
        expect(xml).toContain('<BICFI>BNPAFRPP</BICFI>');
    });
});

describe('swift — pain.002 status parsing', () => {
    test('maps ISO 20022 status codes', () => {
        expect(mapStatusCode('ACSC')).toBe(PAYMENT_STATUS.COMPLETED);
        expect(mapStatusCode('ACCC')).toBe(PAYMENT_STATUS.COMPLETED);
        expect(mapStatusCode('ACSP')).toBe(PAYMENT_STATUS.PROCESSING);
        expect(mapStatusCode('ACTC')).toBe(PAYMENT_STATUS.PROCESSING);
        expect(mapStatusCode('PDNG')).toBe(PAYMENT_STATUS.PROCESSING);
        expect(mapStatusCode('RJCT')).toBe(PAYMENT_STATUS.FAILED);
        expect(mapStatusCode('CANC')).toBe(PAYMENT_STATUS.CANCELLED);
        expect(mapStatusCode('???')).toBe(PAYMENT_STATUS.PROCESSING);
    });

    test('parses a pain.002 TxSts + reason', () => {
        const xml = `<?xml version="1.0"?><Document><CstmrPmtStsRpt><OrgnlPmtInfAndSts>
            <TxInfAndSts><OrgnlEndToEndId>msg-id-001</OrgnlEndToEndId><TxSts>RJCT</TxSts>
            <StsRsnInf><Rsn><Cd>AC04</Cd></Rsn><AddtlInf>Account closed</AddtlInf></StsRsnInf>
            </TxInfAndSts></OrgnlPmtInfAndSts></CstmrPmtStsRpt></Document>`;
        const parsed = parsePain002(xml);
        expect(parsed.statusCode).toBe('RJCT');
        expect(parsed.status).toBe(PAYMENT_STATUS.FAILED);
        expect(parsed.reason).toBe('Account closed');
        expect(parsed.providerRef).toBe('msg-id-001');
    });

    test('parses a settled ACSC report', () => {
        const xml = `<Document><GrpHdr/><OrgnlGrpInfAndSts><GrpSts>ACSC</GrpSts></OrgnlGrpInfAndSts></Document>`;
        expect(parsePain002(xml).status).toBe(PAYMENT_STATUS.COMPLETED);
    });
});

describe('swift — BankTransport seam', () => {
    test('default throwingBankTransport.submit throws IntegrationRequiredError', async () => {
        await expect(throwingBankTransport.submit('<xml/>', {})).rejects.toBeInstanceOf(IntegrationRequiredError);
        await expect(throwingBankTransport.fetchStatus('ref')).rejects.toBeInstanceOf(IntegrationRequiredError);
    });

    test('default provider (no transport) is not configured and initiate throws IntegrationRequiredError', async () => {
        const p = createSwiftProvider({ env: envFn(ENV) }); // throwing transport
        expect(p.IS_CONFIGURED).toBe(false);
        await expect(p.initiate(baseReq())).rejects.toBeInstanceOf(IntegrationRequiredError);
    });

    test('with a real transport, initiate submits pain.001 and maps the returned status', async () => {
        const captured = {};
        const transport = {
            id: 'fake-host2host',
            async submit(xml, ctx) {
                captured.xml = xml;
                captured.ctx = ctx;
                return { providerRef: 'UETR-abc-123', statusXml: '<Document><TxSts>ACTC</TxSts></Document>' };
            },
            async fetchStatus() {
                return '<Document><TxSts>ACSC</TxSts><OrgnlEndToEndId>msg-id-001</OrgnlEndToEndId></Document>';
            },
        };
        const p = createSwiftProvider({ env: envFn(ENV), transport });
        expect(p.IS_CONFIGURED).toBe(true);

        const res = await p.initiate(baseReq());
        expect(captured.xml).toContain('<InstdAmt Ccy="EUR">1917.50</InstdAmt>');
        expect(captured.ctx.idempotencyKey).toBe('msg-id-001');
        expect(res.rail).toBe(PAYMENT_RAIL.SWIFT);
        expect(res.providerRef).toBe('UETR-abc-123');
        expect(res.status).toBe(PAYMENT_STATUS.PROCESSING); // ACTC

        const status = await p.getStatus('UETR-abc-123');
        expect(status.status).toBe(PAYMENT_STATUS.COMPLETED); // ACSC
    });

    test('unconfigured env (no debtor IBAN) throws IntegrationRequiredError even with a transport', async () => {
        const transport = { id: 't', async submit() { return { providerRef: 'x' }; }, async fetchStatus() { return ''; } };
        const p = createSwiftProvider({ env: envFn({ SWIFT_BANK_TRANSPORT: 't' }), transport });
        await expect(p.initiate(baseReq())).rejects.toBeInstanceOf(IntegrationRequiredError);
    });
});
