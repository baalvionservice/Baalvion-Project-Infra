import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRetiredHref, unwrapRetiredLinks } from './retired-links';

test('flags the root-flat guides that 301 to the homepage', () => {
  // The five that were live on lawelitenetwork.com, trailing slash and all.
  for (const href of [
    '/best-car-accident-lawyer/',
    '/what-does-a-car-accident-lawyer-do',
    '/boating-accident-lawyer/',
    '/boating-accident-statute-of-limitations/',
    '/how-the-us-legal-system-works/',
  ]) {
    assert.equal(isRetiredHref(href), true, href);
  }
});

test('flags retired sections and practice areas, old slug forms included', () => {
  assert.equal(isRetiredHref('/news'), true);
  assert.equal(isRetiredHref('/case-law'), true);
  assert.equal(isRetiredHref('/criminal-law/miranda-rights-explained'), true);
  assert.equal(isRetiredHref('/law/dispute-resolution/arbitration'), true);
});

test('leaves live guides, hubs and non-category routes alone', () => {
  for (const href of [
    '/personal-injury-lawyer',
    '/maritime-offshore-injury-law/overview',
    '/what-is-a-personal-injury-lawyer',
    // Regression: an "anything not a live category" rule would eat these.
    '/author/deepak-kumar-kuldeep',
    '/article/miranda-rights-explained',
    '/privacy-policy',
    'https://example.com/news',
    '#jones-act',
  ]) {
    assert.equal(isRetiredHref(href), false, href);
  }
});

test('keeps the sentence and drops only the dead anchor', () => {
  assert.equal(
    unwrapRetiredLinks('<p>See our <a href="/boating-accident-lawyer/">boating accident guide</a> for more.</p>'),
    '<p>See our boating accident guide for more.</p>',
  );
});

test('leaves live links untouched', () => {
  const html = '<p>Read <a href="/what-is-a-personal-injury-lawyer">this guide</a>.</p>';
  assert.equal(unwrapRetiredLinks(html), html);
});

test('handles several anchors in one body independently', () => {
  assert.equal(
    unwrapRetiredLinks('<a href="/news">News</a> and <a href="/personal-injury-lawyer">PI</a>'),
    'News and <a href="/personal-injury-lawyer">PI</a>',
  );
});
