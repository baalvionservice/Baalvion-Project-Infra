import { test } from 'node:test';
import assert from 'node:assert';
import { buildContentPayload, citationsOf, slugifyTitle, validateSave } from './cms-save';

const base = { title: 'How Ruth Bader Ginsburg Shaped Equal Protection Law', slug: undefined, excerpt: 'A short look.', body: 'Hello [Ruth](/people/ruth-bader-ginsburg) and [Wikipedia](https://en.wikipedia.org/wiki/Ruth_Bader_Ginsburg).\n\n## Section\n\nMore.', categoryId: '66b14603-4b88-4ed3-b48d-66c8d6ba8cfb', author: 'Editorial Team' };

test('a new article is a draft-ready CMS article with one html block', () => {
  const p = buildContentPayload(base, false) as any;
  assert.equal(p.contentType, 'article');
  assert.equal(p.slug, 'how-ruth-bader-ginsburg-shaped-equal-protection-law');
  assert.equal(p.contentBlocks.length, 1);
  assert.equal(p.contentBlocks[0].type, 'html');
  assert.ok(p.contentBlocks[0].content.html.includes('<a href="/people/ruth-bader-ginsburg">Ruth</a>'));
  assert.ok(p.contentBlocks[0].content.html.includes('<h2>Section</h2>'));
  assert.equal(p.customFields.author, 'Editorial Team');
  assert.deepEqual(p.customFields.citations, [{ title: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ruth_Bader_Ginsburg' }]);
});

test('an update never sends the create-only fields (so a live URL cannot change)', () => {
  const p = buildContentPayload({ ...base, slug: 'x' }, true) as any;
  assert.equal(p.slug, undefined);
  assert.equal(p.contentType, undefined);
});

test('only outside links count as sources, once each', () => {
  const c = citationsOf('[a](/internal) [b](https://x.com/1) [c](https://x.com/1) [d](https://y.com)');
  assert.deepEqual(c.map((x) => x.url), ['https://x.com/1', 'https://y.com']);
});

test('input problems come back in plain words', () => {
  assert.match(validateSave({ ...base, title: ' ' })!, /headline/);
  assert.match(validateSave({ ...base, categoryId: 'nope' })!, /category/i);
  assert.match(validateSave({ ...base, author: '' })!, /author/i);
  assert.match(validateSave({ ...base, slug: 'Bad Slug' })!, /slug/i);
  assert.equal(validateSave(base), null);
});

test('slugs are clean, accent-free and length-capped', () => {
  assert.equal(slugifyTitle('Café Law: What’s Next?'), 'cafe-law-whats-next');
  assert.ok(slugifyTitle('a'.repeat(300)).length <= 110);
});
