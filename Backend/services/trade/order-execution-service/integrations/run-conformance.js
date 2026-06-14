'use strict';
/**
 * Plain-node fallback runner for the conformance suites — no jest required.
 *
 * Provides minimal global `describe`/`test` shims, then loads each domain's
 * conformance suite (which self-registers against its mock) and reports
 * pass/fail. Use when jest config cannot pick up this directory.
 *
 *   node integrations/run-conformance.js
 */
let passed = 0;
let failed = 0;
const failures = [];
const queue = [];
let suiteDepth = 0;

global.describe = function (name, fn) {
    suiteDepth++;
    fn();
    suiteDepth--;
};
global.test = function (name, fn) {
    queue.push({ name, fn });
};
global.it = global.test;

// Loading these registers their self-run blocks via the describe/test shims.
require('./payment/conformance.test');
require('./sanctions/conformance.test');
require('./kyc/conformance.test');
require('./customs/conformance.test');
require('./carrier/conformance.test');
require('./ebl/conformance.test');

(async () => {
    for (const t of queue) {
        try {
            await t.fn();
            passed++;
            process.stdout.write(`  ok  - ${t.name}\n`);
        } catch (err) {
            failed++;
            failures.push({ name: t.name, err });
            process.stdout.write(` FAIL - ${t.name}: ${err && err.message}\n`);
        }
    }
    process.stdout.write(`\nconformance: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);
    if (failed) {
        for (const f of failures) process.stdout.write(`\n[${f.name}]\n${f.err && f.err.stack}\n`);
        process.exit(1);
    }
})();
