import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseSesEvent, handleSnsRequest, canonicalString, ALLOWED_CERT_HOST } = require('../src/sns');

test('parseSesEvent maps a hard bounce', () => {
    const ev = parseSesEvent({
        eventType: 'Bounce',
        mail: { messageId: 'm1', destination: ['x@y.com'] },
        bounce: { bounceType: 'Permanent', bounceSubType: 'General', bouncedRecipients: [{ emailAddress: 'x@y.com' }] },
    });
    assert.equal(ev.status, 'bounced');
    assert.equal(ev.messageId, 'm1');
    assert.equal(ev.detail.hardBounce, true);
    assert.deepEqual(ev.recipients, ['x@y.com']);
});

test('parseSesEvent maps delivery + complaint + reject + delay', () => {
    assert.equal(parseSesEvent({ eventType: 'Delivery', mail: { messageId: 'm' } }).status, 'delivered');
    assert.equal(parseSesEvent({ eventType: 'Complaint', mail: { messageId: 'm' }, complaint: {} }).status, 'complained');
    assert.equal(parseSesEvent({ eventType: 'Reject', mail: { messageId: 'm' }, reject: { reason: 'virus' } }).status, 'rejected');
    assert.equal(parseSesEvent({ eventType: 'DeliveryDelay', mail: { messageId: 'm' }, deliveryDelay: {} }).status, 'delayed');
    assert.equal(parseSesEvent({ eventType: 'Rendering Failure', mail: { messageId: 'm' }, failure: {} }).status, 'rendering_failed');
});

test('handleSnsRequest records a Notification delivery status (verify disabled in test)', async () => {
    const updates = [];
    const store = { updateStatus: async (id, status, ev) => updates.push({ id, status, ev }) };
    const inner = JSON.stringify({ eventType: 'Delivery', mail: { messageId: 'abc', destination: ['a@b.com'] } });
    const res = await handleSnsRequest({
        body: JSON.stringify({ Type: 'Notification', Message: inner, TopicArn: 'arn:x' }),
        store, logger: { info() {}, warn() {}, error() {} }, verify: false,
    });
    assert.equal(res.action, 'recorded');
    assert.equal(res.status, 'delivered');
    assert.equal(updates[0].id, 'abc');
    assert.equal(updates[0].status, 'delivered');
});

test('handleSnsRequest rejects an invalid signature with 403', async () => {
    await assert.rejects(
        () => handleSnsRequest({
            body: JSON.stringify({ Type: 'Notification', Message: '{}', Signature: 'x', SignatureVersion: '1', SigningCertURL: 'https://sns.ap-south-1.amazonaws.com/cert.pem' }),
            logger: { info() {}, warn() {}, error() {} }, verify: true,
        }),
        (err) => err.statusCode === 403,
    );
});

test('canonicalString includes Type and ordered fields', () => {
    const s = canonicalString({ Type: 'Notification', Message: 'm', MessageId: 'id', Timestamp: 't', TopicArn: 'arn' });
    assert.match(s, /^Message\nm\nMessageId\nid\n/);
    assert.match(s, /Type\nNotification\n$/);
});

test('cert host allowlist only trusts sns.<region>.amazonaws.com', () => {
    assert.ok(ALLOWED_CERT_HOST.test('sns.ap-south-1.amazonaws.com'));
    assert.ok(!ALLOWED_CERT_HOST.test('evil.com'));
    assert.ok(!ALLOWED_CERT_HOST.test('sns.ap-south-1.amazonaws.com.evil.com'));
});
