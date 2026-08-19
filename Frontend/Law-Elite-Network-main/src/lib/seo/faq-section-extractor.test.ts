import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractFaqSection } from './faq-section-extractor';

test('extracts a delineated legacy FAQ section and removes it from the body', () => {
  const html =
    '<h2>Overview</h2><p>Intro.</p>' +
    '<h2>Frequently Asked Questions</h2>' +
    '<p><strong>Do I need a shareholder agreement?</strong> Yes, articles alone rarely cover deadlock or exit terms in enough depth.</p>' +
    '<p><strong>What happens if a new investor never signs?</strong> They are simply not bound by it until they do.</p>' +
    '<h2>Sources & Further Reading</h2><ul><li>Some source</li></ul>';
  const { pairs, html: cleaned } = extractFaqSection(html);
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].question, 'Do I need a shareholder agreement?');
  assert.match(pairs[0].answer, /articles alone/);
  assert.ok(!cleaned.includes('Frequently Asked Questions'));
  assert.ok(cleaned.includes('Overview'));
  assert.ok(cleaned.includes('Sources & Further Reading'));
});

test('extracts an h3-question format FAQ section', () => {
  const html =
    '<h2>FAQ</h2>' +
    '<h3>Is arbitration binding?</h3><p>Yes, arbitral awards are generally final and binding on the parties.</p>' +
    '<h3>Can I appeal an award?</h3><p>Generally no, except on narrow procedural grounds such as fraud.</p>';
  const { pairs, html: cleaned } = extractFaqSection(html);
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].question, 'Is arbitration binding?');
  assert.ok(!cleaned.includes('Is arbitration binding?'));
});

test('does not touch a stray question-headed subheading outside a labeled FAQ section', () => {
  const html =
    '<h2>Overview</h2>' +
    '<h3>Do I need a lawyer for this?</h3><p>Not always, but it helps for anything contested.</p>';
  const { pairs, html: cleaned } = extractFaqSection(html);
  assert.deepEqual(pairs, []);
  assert.equal(cleaned, html);
});

test('fewer than 2 pairs: no extraction, body unchanged', () => {
  const html =
    '<h2>Frequently Asked Questions</h2>' +
    '<p><strong>Just one question here?</strong> With a sufficiently long single answer, but only one pair total.</p>';
  const { pairs, html: cleaned } = extractFaqSection(html);
  assert.deepEqual(pairs, []);
  assert.equal(cleaned, html);
});

test('returns empty for null/undefined/empty input', () => {
  assert.deepEqual(extractFaqSection(null), { pairs: [], html: '' });
  assert.deepEqual(extractFaqSection(undefined), { pairs: [], html: '' });
  assert.deepEqual(extractFaqSection(''), { pairs: [], html: '' });
});
