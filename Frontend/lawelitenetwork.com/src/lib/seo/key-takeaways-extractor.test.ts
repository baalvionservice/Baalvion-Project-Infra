import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractKeyTakeaways } from './key-takeaways-extractor';

test('extracts list items and strips the block from the body', () => {
  const html =
    '<p>Intro paragraph.</p>' +
    '<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>First point.</li><li>Second point.</li></ul></div>' +
    '<p>More body after.</p>';
  const { items, html: cleaned } = extractKeyTakeaways(html);
  assert.deepEqual(items, ['First point.', 'Second point.']);
  assert.ok(!cleaned.includes('key-takeaways'));
  assert.ok(cleaned.includes('Intro paragraph.'));
  assert.ok(cleaned.includes('More body after.'));
});

test('no block present: empty items, html unchanged', () => {
  const html = '<p>Just a plain article body.</p>';
  const { items, html: cleaned } = extractKeyTakeaways(html);
  assert.deepEqual(items, []);
  assert.equal(cleaned, html);
});

test('returns empty for null/undefined/empty input', () => {
  assert.deepEqual(extractKeyTakeaways(null), { items: [], html: '' });
  assert.deepEqual(extractKeyTakeaways(undefined), { items: [], html: '' });
  assert.deepEqual(extractKeyTakeaways(''), { items: [], html: '' });
});
