import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractFaqFromHtml } from './faq-extractor';

test('format A: existing question-headed subheading format', () => {
  const html = `
    <h2>Overview</h2>
    <p>Some intro text.</p>
    <h3>Do I need a lawyer for this?</h3>
    <p>Not always, but it helps for anything contested.</p>
    <h3>How long does the process take?</h3>
    <p>It varies widely by jurisdiction and complexity of the case.</p>
  `;
  const pairs = extractFaqFromHtml(html);
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].question, 'Do I need a lawyer for this?');
  assert.match(pairs[0].answer, /Not always/);
  assert.equal(pairs[1].question, 'How long does the process take?');
});

test('format B: legacy strong-question paragraph inside an FAQ section', () => {
  const html = `
    <h2>Frequently Asked Questions</h2>
    <p><strong>Can I appeal an arbitration award?</strong> Generally no, except on narrow procedural grounds such as fraud or lack of jurisdiction.</p>
    <p><strong>Is arbitration binding?</strong> Yes, arbitral awards are generally final and binding on the parties.</p>
  `;
  const pairs = extractFaqFromHtml(html);
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].question, 'Can I appeal an arbitration award?');
  assert.match(pairs[0].answer, /narrow procedural grounds/);
});

test('format B: multiple legacy questions in one FAQ section', () => {
  const html = `
    <h2>Frequently Asked Questions</h2>
    <p><strong>Is arbitration always confidential?</strong> Not automatically -- it depends on the institutional rules or an express clause.</p>
    <p><strong>Can I choose arbitration after a dispute has started?</strong> Yes, via a separate submission agreement if both sides consent.</p>
    <p><strong>What happens if a party ignores the award?</strong> Enforcement proceedings can follow under applicable domestic or treaty law.</p>
  `;
  const pairs = extractFaqFromHtml(html);
  assert.equal(pairs.length, 3);
  assert.deepEqual(
    pairs.map((p) => p.question),
    [
      'Is arbitration always confidential?',
      'Can I choose arbitration after a dispute has started?',
      'What happens if a party ignores the award?',
    ],
  );
});

test('malformed FAQ content is ignored safely', () => {
  const html = `
    <h2>Frequently Asked Questions</h2>
    <p><strong>Not phrased as a question.</strong> This has an answer but no question mark.</p>
    <p><strong>Too short?</strong> Nope.</p>
    <p>No bold lead-in at all, just a plain paragraph.</p>
    <p><strong>A real question here?</strong> A sufficiently long answer that clears the minimum length threshold for a valid FAQ pair.</p>
  `;
  // Only one of the four paragraphs is a valid Q&A pair, so the >= 2 pair
  // threshold isn't met and the result is empty rather than a single
  // half-formed FAQPage entry.
  const pairs = extractFaqFromHtml(html);
  assert.deepEqual(pairs, []);
});

test('mixed FAQ content: format A and format B combine within the same article', () => {
  const html = `
    <h3>Existing heading-question that still works?</h3>
    <p>Yes, format A questions aren't gated by an FAQ section heading.</p>
    <h2>Frequently Asked Questions</h2>
    <p><strong>And a legacy question in its own section?</strong> Yes, both formats are recognized together.</p>
  `;
  const pairs = extractFaqFromHtml(html);
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].question, 'Existing heading-question that still works?');
  assert.equal(pairs[1].question, 'And a legacy question in its own section?');
});

test('no false positives: strong-question paragraphs outside a recognized FAQ section are ignored', () => {
  const html = `
    <h2>Key Terms</h2>
    <p><strong>Is this glossary entry phrased like a question?</strong> It is, but it's not under an FAQ heading, so it must not be extracted.</p>
    <p><strong>Neither is this one?</strong> Same reasoning applies here too, for a second paragraph.</p>
  `;
  const pairs = extractFaqFromHtml(html);
  assert.deepEqual(pairs, []);
});

test('duplicate questions across formats are not double-counted', () => {
  const html = `
    <h2>Frequently Asked Questions</h2>
    <p><strong>Is this a duplicate question?</strong> First answer text that is long enough to qualify as valid.</p>
    <p><strong>Is this a duplicate question?</strong> Second answer text that is also long enough to qualify as valid.</p>
    <p><strong>Is this a different question?</strong> A distinct answer that is long enough to qualify as valid too.</p>
  `;
  const pairs = extractFaqFromHtml(html);
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].question, 'Is this a duplicate question?');
  assert.equal(pairs[1].question, 'Is this a different question?');
});

test('returns an empty array for null/undefined/empty input', () => {
  assert.deepEqual(extractFaqFromHtml(null), []);
  assert.deepEqual(extractFaqFromHtml(undefined), []);
  assert.deepEqual(extractFaqFromHtml(''), []);
});

test('a lone FAQ pair (below the 2-pair minimum) yields no FAQPage data', () => {
  const html = `
    <h2>Frequently Asked Questions</h2>
    <p><strong>Just one question here?</strong> With a sufficiently long single answer, but only one pair total.</p>
  `;
  assert.deepEqual(extractFaqFromHtml(html), []);
});
