'use strict';
const { test } = require('node:test');
const assert = require('node:assert');

require('../_env'); // dummy auth/billing secrets so the fail-loud config boots under CI (no .env)
const otp = require('../service/otpLoginService');
const { sha256 } = require('../utils/crypto');

const liveRecord = (code, over = {}) => ({
    expires_at: new Date(Date.now() + 60_000),
    attempts: 0,
    code_hash: sha256(code),
    ...over,
});

test('generateNumericCode produces a code of the requested length, digits only', () => {
    const code = otp.generateNumericCode(6);
    assert.match(code, /^[0-9]{6}$/);
    assert.strictEqual(otp.generateNumericCode(4).length, 4);
});

test('classifyOtpAttempt: correct code => ok', () => {
    const code = otp.generateNumericCode(6);
    assert.strictEqual(otp.classifyOtpAttempt(liveRecord(code), code).outcome, 'ok');
});

test('classifyOtpAttempt: wrong code => invalid and burns an attempt', () => {
    const code = otp.generateNumericCode(6);
    const res = otp.classifyOtpAttempt(liveRecord(code), '000000');
    assert.strictEqual(res.outcome, 'invalid');
    assert.strictEqual(res.attempts, 1);
});

test('classifyOtpAttempt: a wrong guess at the last allowed try is exhausted', () => {
    const code = otp.generateNumericCode(6);
    const res = otp.classifyOtpAttempt(liveRecord(code, { attempts: 4 }), '000000', { maxAttempts: 5 });
    assert.strictEqual(res.outcome, 'invalid');
    assert.strictEqual(res.exhausted, true);
});

test('classifyOtpAttempt: expired code => expired', () => {
    const code = otp.generateNumericCode(6);
    assert.strictEqual(otp.classifyOtpAttempt(liveRecord(code, { expires_at: new Date(Date.now() - 1) }), code).outcome, 'expired');
});

test('classifyOtpAttempt: attempts at/over the max => locked', () => {
    const code = otp.generateNumericCode(6);
    assert.strictEqual(otp.classifyOtpAttempt(liveRecord(code, { attempts: 5 }), code, { maxAttempts: 5 }).outcome, 'locked');
});

test('classifyOtpAttempt: no record => no_code', () => {
    assert.strictEqual(otp.classifyOtpAttempt(null, '123456').outcome, 'no_code');
});

test('maskEmail hides the local part but keeps the domain', () => {
    assert.strictEqual(otp.maskEmail('jane.doe@example.com'), 'j*******@example.com');
    assert.strictEqual(otp.maskEmail('a@b.com'), 'a*@b.com');
});
