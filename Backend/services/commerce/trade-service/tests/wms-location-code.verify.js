'use strict';
/**
 * Warehouse Management System, Phase A — grnNumber.js / locationCode.js /
 * qrLabel.js verification. Pure (crypto + a pure-JS rendering lib), no DB.
 *
 *   node tests/wms-location-code.verify.js
 */
const assert = require('assert');
const { generateGrnNumber } = require('../service/warehouse/grnNumber');
const { generateLocationCode } = require('../service/warehouse/locationCode');
const { renderLabelSvg } = require('../service/warehouse/qrLabel');

let pass = 0;
let fail = 0;
const failures = [];

async function t(name, fn) {
    try {
        await fn();
        pass += 1;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        fail += 1;
        failures.push({ name, message: err.message });
        console.log(`  ✗ ${name}\n      ${err.message}`);
    }
}

async function run() {
    await t('generateGrnNumber() produces the GRN-<time>-<hex> shape', () => {
        const id = generateGrnNumber();
        assert.match(id, /^GRN-[0-9A-Z]+-[0-9A-F]{4}$/);
    });
    await t('generateGrnNumber() is unique across calls', () => {
        const a = generateGrnNumber();
        const b = generateGrnNumber();
        assert.notStrictEqual(a, b);
    });

    await t('generateLocationCode("zone") produces the Z-<time>-<hex> shape', () => {
        const code = generateLocationCode('zone');
        assert.match(code, /^Z-[0-9A-Z]+-[0-9A-F]{4}$/);
    });
    await t('generateLocationCode("bin") produces the BIN-<time>-<hex> shape', () => {
        const code = generateLocationCode('bin');
        assert.match(code, /^BIN-[0-9A-Z]+-[0-9A-F]{4}$/);
    });
    await t('generateLocationCode() is unique across calls', () => {
        const a = generateLocationCode('bin');
        const b = generateLocationCode('bin');
        assert.notStrictEqual(a, b);
    });

    await t('renderLabelSvg() produces a non-empty SVG document', async () => {
        const svg = await renderLabelSvg('BIN-M3F8K2A1-9C4E');
        assert.ok(svg.length > 0);
        assert.ok(svg.trim().startsWith('<svg'));
    });
    await t('renderLabelSvg() rejects an empty code', async () => {
        await assert.rejects(() => renderLabelSvg(''));
    });

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Location code + QR label generation — ${pass} passed, ${fail} failed`);
    if (fail > 0) {
        console.log('\nFailures:');
        for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
        process.exit(1);
    }
    process.exit(0);
}

run();
