'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'db', 'migrations');

test('migrations directory exists and is non-empty', () => {
    assert.ok(fs.existsSync(DIR), 'db/migrations should exist');
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql'));
    assert.ok(files.length > 0, 'expected at least one .sql migration');
});

test('migrations are uniquely + monotonically numbered (NNNN_ prefix)', () => {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
    const seen = new Set();
    let last = -1;
    for (const f of files) {
        const m = /^(\d{4})_/.exec(f);
        assert.ok(m, `migration "${f}" must start with a 4-digit number`);
        const n = Number(m[1]);
        assert.ok(!seen.has(n), `duplicate migration number ${m[1]}`);
        assert.ok(n > last, `migration ${f} is out of order`);
        seen.add(n);
        last = n;
    }
});

test('every migration file is non-empty SQL', () => {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql'));
    for (const f of files) {
        const sql = fs.readFileSync(path.join(DIR, f), 'utf8').trim();
        assert.ok(sql.length > 0, `migration ${f} is empty`);
    }
});
