'use strict';
const v = require('../validators/kyc');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==';
const ok = { fullName: 'Kay Wai', dateOfBirth: '1990-05-05', nationality: 'Indian', idType: 'passport', idNumberLast4: '1234', idDocument: PNG, selfie: PNG };

describe('kyc validators', () => {
    it('accepts a complete adult submission', () => {
        expect(v.submitSchema.safeParse(ok).success).toBe(true);
    });

    it('rejects under-18s and impossible dates', () => {
        expect(v.submitSchema.safeParse({ ...ok, dateOfBirth: new Date().toISOString().slice(0, 10) }).success).toBe(false);
        expect(v.submitSchema.safeParse({ ...ok, dateOfBirth: '1850-01-01' }).success).toBe(false);
        expect(v.submitSchema.safeParse({ ...ok, dateOfBirth: '05/05/1990' }).success).toBe(false);
    });

    it('checks real file signatures, not just the declared type', () => {
        const fake = `data:image/png;base64,${Buffer.from('MZ not an image').toString('base64')}`;
        expect(v.parseDataUrl(fake)).toBeNull();
        expect(v.parseDataUrl(PNG).mime).toBe('image/png');
        const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4 test').toString('base64')}`;
        expect(v.parseDataUrl(pdf).mime).toBe('application/pdf');
    });

    it('rejects other types, empty and oversized files', () => {
        expect(v.parseDataUrl('data:text/html;base64,PGgxPg==')).toBeNull();
        expect(v.parseDataUrl('data:image/png;base64,')).toBeNull();
        const big = `data:image/png;base64,${Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(v.MAX_FILE_BYTES)]).toString('base64')}`;
        expect(v.parseDataUrl(big)).toBeNull();
    });

    it('requires a reason to reject', () => {
        expect(v.decisionSchema.safeParse({ status: 'rejected' }).success).toBe(false);
        expect(v.decisionSchema.safeParse({ status: 'rejected', reason: 'Blurry' }).success).toBe(true);
        expect(v.decisionSchema.safeParse({ status: 'approved' }).success).toBe(true);
        expect(v.decisionSchema.safeParse({ status: 'expired' }).success).toBe(false);
    });
});

describe('kyc encryption', () => {
    const crypto = require('../utils/kycCrypto');
    const prev = process.env.KYC_ENCRYPTION_KEY;
    afterAll(() => { process.env.KYC_ENCRYPTION_KEY = prev; });

    it('round-trips with a key and never emits plaintext', () => {
        process.env.KYC_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
        const plain = Buffer.from('sensitive scan bytes');
        const enc = crypto.encrypt(plain);
        expect(enc.ciphertext.includes(plain)).toBe(false);
        expect(crypto.decrypt(enc).equals(plain)).toBe(true);
    });

    it('detects tampering', () => {
        process.env.KYC_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
        const enc = crypto.encrypt(Buffer.from('abc'));
        enc.ciphertext[0] ^= 1;
        expect(() => crypto.decrypt(enc)).toThrow();
    });

    it('refuses to work without a valid key', () => {
        process.env.KYC_ENCRYPTION_KEY = '';
        expect(crypto.isConfigured()).toBe(false);
        expect(() => crypto.encrypt(Buffer.from('x'))).toThrow();
        process.env.KYC_ENCRYPTION_KEY = Buffer.alloc(8).toString('base64');
        expect(crypto.isConfigured()).toBe(false);
    });
});
