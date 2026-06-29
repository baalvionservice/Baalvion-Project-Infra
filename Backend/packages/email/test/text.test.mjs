import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { htmlToText } = require('../src/text');

test('strips tags and decodes entities', () => {
    const t = htmlToText('<h1>Hello &amp; welcome</h1><p>Your code is <strong>123</strong>.</p>');
    assert.match(t, /Hello & welcome/);
    assert.match(t, /Your code is 123\./);
    assert.ok(!t.includes('<'), 'no angle brackets should remain');
});

test('keeps link URLs as "label (href)"', () => {
    const t = htmlToText('<a href="https://baalvion.com/verify">Verify</a>');
    assert.match(t, /Verify \(https:\/\/baalvion\.com\/verify\)/);
});

test('drops style/script and hidden preheader content', () => {
    const t = htmlToText('<style>.x{color:red}</style><div style="display:none">preheader</div><p>Body</p>');
    assert.ok(!t.includes('color:red'));
    assert.ok(!t.toLowerCase().includes('preheader'));
    assert.match(t, /Body/);
});

test('converts block boundaries to newlines and collapses blank runs', () => {
    const t = htmlToText('<p>Line one</p><p>Line two</p>');
    assert.equal(t, 'Line one\nLine two');
});

test('empty / nullish input returns empty string', () => {
    assert.equal(htmlToText(''), '');
    assert.equal(htmlToText(undefined), '');
});
