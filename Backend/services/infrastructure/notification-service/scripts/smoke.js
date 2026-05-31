'use strict';
// Channel smoke test — drives the channel services directly against the running
// Redis (dev "log" providers, no external creds). If the service is also running,
// its workers will pick up the dispatch-enqueued jobs (visible in its logs).
//   node scripts/smoke.js
require('dotenv').config();
const redis = require('../config/redis');
const deviceService = require('../service/deviceService');
const inappService  = require('../service/inappService');
const smsService    = require('../service/smsService');
const pushService   = require('../service/pushService');
const dispatchService = require('../service/dispatchService');

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n, JSON.stringify(x ?? '')); } };

(async () => {
    await redis.connect();
    const U = 'smoke-user-1';
    const idem = `smoke-${Date.now()}`;
    const r = redis.getClient();
    await r.del(`notif:devices:${U}`, `notif:prefs:${U}`, `notif:inbox:${U}`, `notif:inbox:read:${U}`);

    await deviceService.registerDevice(U, 'tok-abc', 'web');
    const devices = await deviceService.listDevices(U);
    ok('register + list device token', devices.length === 1 && devices[0].token === 'tok-abc', devices);

    const prefs = await deviceService.getPreferences(U);
    ok('default preferences = all channels on', prefs.email && prefs.sms && prefs.push && prefs.inapp, prefs);

    const inapp = await inappService.sendInApp({ userId: U, title: 'Hello', body: 'In-app test' });
    ok('in-app delivered (Redis pub/sub + inbox)', inapp.delivered === true, inapp);

    let inbox = await inappService.getInbox(U);
    ok('inbox shows 1 unread', inbox.items.length === 1 && inbox.unread === 1, inbox);

    await inappService.markRead(U, inbox.items[0].id);
    inbox = await inappService.getInbox(U);
    ok('mark read → unread 0', inbox.unread === 0, inbox);

    const sms = await smsService.sendSms({ to: '+15551230000', body: 'SMS smoke' });
    ok('SMS via log provider', sms.provider === 'log', sms);

    const push = await pushService.sendPush({ userId: U, title: 'Push', body: 'Push smoke' });
    ok('push via log provider (token auto-resolved)', push.provider === 'log' && push.sent === 1, push);

    const d = await dispatchService.dispatch({
        userId: U, recipients: { email: 'smoke@baalvion.com', phone: '+15551230000' },
        email: { rawSubject: 'Hi', rawHtml: '<p>hi</p>' }, sms: { body: 'multi' },
        push: { title: 'multi', body: 'push' }, inapp: { title: 'multi', body: 'inapp' }, idempotencyKey: idem,
    });
    ok('unified dispatch fans out 4 channels', d.channels.length === 4 && d.result.email?.queued && d.result.sms?.queued && d.result.push?.queued && d.result.inapp?.delivered, d.result);

    await deviceService.setPreferences(U, { sms: false });
    const d2 = await dispatchService.dispatch({ userId: U, recipients: { phone: '+15551230000' }, sms: { body: 'should skip' }, channels: ['sms'] });
    ok('preference off → channel skipped', d2.result.sms?.skipped === 'preference_off', d2.result);

    console.log(`\n${pass} passed, ${fail} failed`);
    setTimeout(() => process.exit(fail ? 1 : 0), 1500); // let running workers process enqueued jobs
})().catch((e) => { console.error(e); process.exit(1); });
