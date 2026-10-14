'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// A stand-in for ../models so no database is needed: it records the INSERT's values.
const inserted = [];
const modelsPath = require.resolve('../models');
require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: { sequelize: { query: async (sql, opts) => { if (/INSERT INTO admin\.site_visitors/.test(sql)) inserted.push(opts.replacements); return [[]]; } } },
};
const { trackVisitor } = require('../controller/trackController');

const run = async (body, headers = {}) => {
    let out;
    const res = { status() { return this; }, json(v) { out = v; return this; } };
    const req = { body, headers, socket: { remoteAddress: '10.0.0.1' }, ip: '10.0.0.1' };
    await trackVisitor(req, res, (e) => { out = e; });
    return out;
};

test('uses the location sent by our own frontend instead of looking the address up', async () => {
    let looked = false;
    const realFetch = global.fetch;
    global.fetch = async () => { looked = true; return { ok: false }; };
    try {
        await run({ userAgent: 'Mozilla/5.0 (iPhone)', ip: '103.225.132.105', geo: { country: 'India', region: 'Maharashtra', city: 'Virār', isp: 'Example ISP', timezone: 'Asia/Kolkata', latitude: '19.45', longitude: '72.81' } }, { 'x-forwarded-for': '103.225.132.105' });
    } finally { global.fetch = realFetch; }
    const row = inserted.at(-1);
    assert.equal(looked, false);
    assert.equal(row.country, 'India');
    assert.equal(row.region, 'Maharashtra');
    assert.equal(row.city, 'Virār');
    assert.equal(row.isp, 'Example ISP');
    assert.equal(row.ip, '103.225.132.105');
    assert.equal(row.device_type, 'Mobile');
});

test('truncates oversized text from the open endpoint', async () => {
    await run({ userAgent: 'x', geo: { country: 'India', city: 'a'.repeat(5000) } });
    assert.equal(inserted.at(-1).city.length, 120);
});
