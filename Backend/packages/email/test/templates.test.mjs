import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const templates = require('../src/templates');

const ctx = { appUrl: 'https://baalvion.com', supportEmail: 'support@baalvion.com', billingEmail: 'billing@baalvion.com' };

test('all 10 templates are present', () => {
    for (const name of ['otp', 'emailVerification', 'welcome', 'passwordReset', 'loginAlert',
        'securityAlert', 'orderConfirmation', 'invoice', 'supportReply', 'newsletter']) {
        assert.ok(templates.TEMPLATE_NAMES.includes(name), `missing template ${name}`);
    }
});

test('otp renders subject/html/text and escapes injection', () => {
    const r = templates.render('otp', { code: '123456', expiresMinutes: 5 }, ctx);
    assert.match(r.subject, /123456/);
    assert.match(r.html, /123456/);
    assert.match(r.html, /prefers-color-scheme: dark/); // dark-mode aware
    assert.equal(r.category, 'auth');
    assert.ok(r.text.length > 0);
});

test('html-escapes user-provided values', () => {
    const r = templates.render('welcome', { name: '<script>alert(1)</script>' }, ctx);
    assert.ok(!r.html.includes('<script>alert(1)</script>'), 'must escape raw script tag');
    assert.match(r.html, /&lt;script&gt;/);
});

test('category mapping is correct', () => {
    assert.equal(templates.categoryOf('invoice'), 'billing');
    assert.equal(templates.categoryOf('securityAlert'), 'security');
    assert.equal(templates.categoryOf('supportReply'), 'support');
});

test('order template renders line items', () => {
    const r = templates.render('orderConfirmation', {
        orderNumber: 'ORD-1', currency: 'INR', total: '999',
        items: [{ name: 'Widget', quantity: 2, total: '999' }],
    }, ctx);
    assert.match(r.html, /Widget/);
    assert.match(r.html, /ORD-1/);
});

test('unknown template throws', () => {
    assert.throws(() => templates.render('nope', {}, ctx), /Unknown email template/);
});

test('contributorInvitation renders accept link and escapes the note', () => {
    const r = templates.render('contributorInvitation', {
        publication: 'Law Elite Network', roleName: 'Editor', inviterName: 'Sam',
        personalNote: '<script>x</script>', acceptUrl: 'https://admin.baalvion.com/invite/tok', email: 'a@b.co', expiresHours: 72,
    }, ctx);
    assert.match(r.subject, /Law Elite Network/);
    assert.ok(r.html.includes('https://admin.baalvion.com/invite/tok'));
    assert.ok(!r.html.includes('<script>x'));
    assert.ok(templates.categoryOf('contributorInvitation'));
});

test('invitation emails use the premium layout; other emails keep the standard one', () => {
    const inv = templates.render('contributorInvitation', { publication: 'Amarisé', roleName: 'Editor', inviterName: 'Tushar', email: 'a@b.com', acceptUrl: 'https://admin.baalvion.com/invite/t', expiresHours: 72 }, ctx);
    assert.match(inv.html, /Trade &middot; Commerce &middot; Intelligence/);
    assert.match(inv.subject, /Tushar has invited you to Amarisé/);
    assert.match(inv.text, /https:\/\/admin\.baalvion\.com\/invite\/t/);
    const otp = templates.render('otp', { code: '123456', expiresMinutes: 5 }, ctx);
    assert.ok(!otp.html.includes('Trade &middot; Commerce'), 'OTP must not pick up the premium shell');
});

test('invitation escapes injected markup in every user-supplied field', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const r = templates.render('contributorInvitation', { publication: evil, roleName: evil, inviterName: evil, personalNote: evil, email: evil, acceptUrl: 'https://x/y', expiresHours: 72 }, ctx);
    assert.ok(!r.html.includes(evil));
    assert.match(r.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('siteAccessGranted names one site, or counts several', () => {
    const one = templates.render('siteAccessGranted', { sites: [{ name: 'Amarisé', url: 'https://admin.baalvion.com/cms/websites/amarise' }], roleName: 'Editor', inviterName: 'Tushar' }, ctx);
    assert.equal(one.subject, 'You now have access to Amarisé');
    assert.match(one.html, /Open Amarisé/);
    const many = templates.render('siteAccessGranted', { sites: [{ name: 'A', url: 'https://x/a' }, { name: 'B', url: 'https://x/b' }], roleName: 'Writer' }, ctx);
    assert.equal(many.subject, 'You now have access to 2 Baalvion sites');
    assert.match(many.text, /A: https:\/\/x\/a/);
    assert.equal(templates.categoryOf('siteAccessGranted'), 'notifications');
});

test('siteAccessGranted tolerates missing optional data', () => {
    const r = templates.render('siteAccessGranted', {}, ctx);
    assert.ok(r.html.length > 0 && r.subject.length > 0);
});
