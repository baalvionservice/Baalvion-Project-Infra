'use strict';
require('./_env');
const test = require('node:test');
const assert = require('node:assert');
const { decodeProofs } = require('../utils/paymentProof');
const { submitPaymentSchema, destinationSchema } = require('../validators/sellerBondSchemas');

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200, 2)]);
const b64 = (b) => b.toString('base64');

test('real images are accepted and decoded', () => {
    const out = decodeProofs([{ mime: 'image/jpeg', data: b64(JPEG) }, { mime: 'image/png', data: b64(PNG) }]);
    assert.strictEqual(out.length, 2);
    assert.strictEqual(out[0].size, JPEG.length);
});

test('a script or renamed file is not accepted as a screenshot', () => {
    assert.throws(() => decodeProofs([{ mime: 'image/png', data: b64(Buffer.from('<script>alert(1)</script>'.repeat(10))) }]), /not a valid image\/png/);
    assert.throws(() => decodeProofs([{ mime: 'image/jpeg', data: b64(PNG) }]), /not a valid image\/jpeg/);
    assert.throws(() => decodeProofs([{ mime: 'text/html', data: b64(JPEG) }]), /only JPEG, PNG or WebP/);
});

test('size and count are capped', () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(3 * 1024 * 1024)]);
    assert.throws(() => decodeProofs([{ mime: 'image/jpeg', data: b64(big) }]), /larger than 2.5 MB/);
    const one = { mime: 'image/jpeg', data: b64(JPEG) };
    assert.throws(() => decodeProofs([one, one, one, one]), /at most 3/);
    assert.deepStrictEqual(decodeProofs([]), []);
});

test('a payment needs a screenshot or a reference', () => {
    assert.ok(!submitPaymentSchema.safeParse({}).success);
    assert.ok(submitPaymentSchema.safeParse({ txHash: 'abc123456' }).success);
    assert.ok(submitPaymentSchema.safeParse({ proofs: [{ mime: 'image/jpeg', data: 'x'.repeat(200) }] }).success);
    assert.ok(!submitPaymentSchema.safeParse({ txHash: 'abc', proofs: [] }).success);
});

test('destinations accept a QR image and pay link', () => {
    assert.ok(destinationSchema.safeParse({ address: '123456789', confirmAddress: '123456789', qrImageUrl: '/pay/x.jpg', payLink: 'https://app.binance.com/uni-qr/AbC' }).success);
});

test('Binance Pay can run on its QR alone, other methods cannot', () => {
    const { validate } = require('../service/paymentDestinationService');
    const v = validate('BINANCE', '', '', 'Mr Balenciaga', '/pay/binance-pay.jpg', 'https://app.binance.com/uni-qr/VJHcV6Q6');
    assert.strictEqual(v.address, '');
    assert.strictEqual(v.qrImageUrl, '/pay/binance-pay.jpg');
    assert.throws(() => validate('BINANCE', '', '', 'x', null, null), /Address is required/);
    assert.throws(() => validate('BTC', '', '', 'x', '/pay/x.jpg', null), /Address is required|only for Binance/);
    assert.throws(() => validate('BINANCE', '', '', 'x', null, 'https://evil.example/uni-qr/x'), /binance\.com/);
    assert.throws(() => validate('BINANCE', '964913051x', '', 'x', null, null), /digits only/);
    assert.strictEqual(validate('BINANCE', '123456789', '', 'x').address, '123456789');
});
