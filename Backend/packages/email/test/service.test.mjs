import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EmailService, createEmailService } = require('../src/EmailService');
const { loadConfig } = require('../src/config');
const { isTransient, withRetry } = require('../src/retry');
const { resolveSender, replyToFor } = require('../src/senders');

// A fake SES client that records the commands it's asked to send.
function fakeSes({ failTimes = 0, error } = {}) {
    let calls = 0;
    return {
        sent: [],
        async send(cmd) {
            calls += 1;
            if (calls <= failTimes) throw error || Object.assign(new Error('boom'), { name: 'ThrottlingException' });
            this.sent.push(cmd.input || cmd);
            return { MessageId: `msg-${calls}` };
        },
    };
}

const config = loadConfig({
    accessKeyId: 'AKIA_TEST', secretAccessKey: 'secret', region: 'ap-south-1',
});

function makeService(ses, store) {
    return new EmailService({ config, sesClient: ses, logger: { info() {}, warn() {}, error() {} },
        store: store || { record: async () => {}, updateStatus: async () => {} } });
}

test('sendOTP picks the auth sender and sends', async () => {
    const ses = fakeSes();
    const records = [];
    const svc = makeService(ses, { record: async (e) => records.push(e), updateStatus: async () => {} });
    const res = await svc.sendOTP({ to: 'a@b.com', code: '111222' });
    assert.equal(res.status, 'sent');
    assert.equal(ses.sent.length, 1);
    assert.match(ses.sent[0].FromEmailAddress, /noreply@baalvion\.com/);
    assert.equal(ses.sent[0].ConfigurationSetName, 'baalvion-production');
    assert.equal(records[0].category, 'auth');
    assert.equal(records[0].status, 'sent');
    assert.equal(records[0].messageId, 'msg-1');
});

test('sendInvoice uses the billing sender', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendInvoice({ to: 'a@b.com', invoiceNumber: 'INV-9', total: '100', currency: 'USD' });
    assert.match(ses.sent[0].FromEmailAddress, /billing@baalvion\.com/);
});

test('sendSecurityAlert uses the security sender', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendSecurityAlert({ to: 'a@b.com', reason: 'new device' });
    assert.match(ses.sent[0].FromEmailAddress, /security@baalvion\.com/);
});

test('retries transient failures then succeeds', async () => {
    const ses = fakeSes({ failTimes: 2 });
    const svc = makeService(ses);
    const res = await svc.sendOTP({ to: 'a@b.com', code: '1' });
    assert.equal(res.status, 'sent');
    assert.equal(res.messageId, 'msg-3');
});

test('does NOT retry permanent failures (hard bounce / rejected)', async () => {
    let calls = 0;
    const ses = {
        async send() { calls += 1; throw Object.assign(new Error('rejected'), { name: 'MessageRejected' }); },
    };
    const svc = makeService(ses);
    const res = await svc.sendOrderNotification({ to: 'a@b.com', orderNumber: 'X', total: '1' });
    assert.equal(res.status, 'failed');     // swallowed, not thrown
    assert.equal(calls, 1, 'permanent error must not be retried');
});

test('skips sending when SES is not configured', async () => {
    const devConfig = loadConfig({ accessKeyId: undefined, secretAccessKey: undefined });
    const svc = new EmailService({ config: devConfig, logger: { info() {}, warn() {}, error() {} } });
    assert.equal(svc.isConfigured(), false);
    const res = await svc.sendOTP({ to: 'a@b.com', code: '1' });
    assert.equal(res.status, 'skipped');
});

test('sendRaw sends pre-rendered html via the chosen category', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendRaw({ to: 'a@b.com', subject: 'Hi', html: '<p>x</p>', category: 'support' });
    assert.match(ses.sent[0].FromEmailAddress, /support@baalvion\.com/);
    assert.equal(ses.sent[0].Content.Simple.Subject.Data, 'Hi');
});

// ── Reply-To by category ───────────────────────────────────────────────────────

test('Reply-To: invoice (billing) → billing@, support reply → support@', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendInvoice({ to: 'a@b.com', invoiceNumber: 'INV-1', total: '5', currency: 'USD' });
    assert.deepEqual(ses.sent[0].ReplyToAddresses, ['billing@baalvion.com']);
    await svc.sendSupportReply({ to: 'a@b.com', message: 'hello' });
    assert.deepEqual(ses.sent[1].ReplyToAddresses, ['support@baalvion.com']);
});

test('Reply-To: auth mail defaults to support@ (replies expected)', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendOTP({ to: 'a@b.com', code: '123' });
    assert.deepEqual(ses.sent[0].ReplyToAddresses, ['support@baalvion.com']);
});

test('replyToFor maps support/billing/invrel; defaults otherwise', () => {
    assert.equal(replyToFor(config, 'support'), 'support@baalvion.com');
    assert.equal(replyToFor(config, 'billing'), 'billing@baalvion.com');
    assert.equal(replyToFor(config, 'invrel'), 'invrel@baalvion.com');
    assert.equal(replyToFor(config, 'security'), config.replyTo);
    assert.equal(replyToFor(config, 'notifications'), config.replyTo);
});

test('sendRaw honours an explicit replyTo override', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendRaw({ to: 'a@b.com', subject: 'Hi', html: '<p>x</p>', category: 'auth', replyTo: 'custom@baalvion.com' });
    assert.deepEqual(ses.sent[0].ReplyToAddresses, ['custom@baalvion.com']);
});

// ── List-Unsubscribe: marketing only ────────────────────────────────────────────

test('newsletter (marketing) gets a List-Unsubscribe header', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendNewsletter({ to: 'a@b.com', subject: 'News', bodyHtml: '<p>hi</p>', unsubscribeUrl: 'https://baalvion.com/u/abc' });
    const headers = ses.sent[0].Content.Simple.Headers || [];
    const names = headers.map((h) => h.Name);
    assert.ok(names.includes('List-Unsubscribe'), 'newsletter must carry List-Unsubscribe');
    assert.ok(names.includes('List-Unsubscribe-Post'), 'one-click unsubscribe header expected');
    const lu = headers.find((h) => h.Name === 'List-Unsubscribe');
    assert.match(lu.Value, /https:\/\/baalvion\.com\/u\/abc/);
});

test('transactional mail (otp) NEVER gets a List-Unsubscribe header', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendOTP({ to: 'a@b.com', code: '999' });
    const headers = ses.sent[0].Content.Simple.Headers || [];
    assert.ok(!headers.some((h) => h.Name === 'List-Unsubscribe'), 'transactional must not be unsubscribable');
});

// ── Plain-text alternative ───────────────────────────────────────────────────────

test('sendRaw derives a text/plain alternative when text is omitted', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendRaw({ to: 'a@b.com', subject: 'Hi', html: '<p>Hello there</p>', category: 'support' });
    const body = ses.sent[0].Content.Simple.Body;
    assert.ok(body.Text && body.Text.Data, 'a Text part must be present');
    assert.match(body.Text.Data, /Hello there/);
});

test('every template send includes both Html and Text parts', async () => {
    const ses = fakeSes();
    const svc = makeService(ses);
    await svc.sendOrderNotification({ to: 'a@b.com', orderNumber: 'O-1', total: '1', currency: 'USD' });
    const body = ses.sent[0].Content.Simple.Body;
    assert.ok(body.Html && body.Html.Data, 'Html part present');
    assert.ok(body.Text && body.Text.Data, 'Text part present');
});

test('retry classifier: 5xx transient, 4xx permanent', () => {
    assert.equal(isTransient({ $metadata: { httpStatusCode: 503 } }), true);
    assert.equal(isTransient({ $metadata: { httpStatusCode: 400 } }), false);
    assert.equal(isTransient({ name: 'ThrottlingException' }), true);
    assert.equal(isTransient({ name: 'MessageRejected' }), false);
});

test('resolveSender rejects unknown categories', () => {
    assert.throws(() => resolveSender(config, 'bogus'), /Unknown email category/);
});
