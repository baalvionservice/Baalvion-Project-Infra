import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArticleMetadata } from './article-seo';
import { buildAuthorLd } from './author-ld';

const SITE = 'https://lawelitenetwork.com';

/**
 * The retirement shrank the sitemap but not the index: 75 retired-category
 * articles stayed `index, follow`, so the advertised 55-URL site was really
 * ~130 indexable pages, most of them orphaned.
 */
test('a retired-category article is noindex but still followed', () => {
  const m = buildArticleMetadata(
    { title: 'Unfair Dismissal in the UK', category: { slug: 'employment-labor' } },
    'unfair-dismissal-uk-guide', SITE,
  );
  assert.deepEqual(m.robots, { index: false, follow: true });
});

test('a kept-category article stays indexable', () => {
  const m = buildArticleMetadata(
    { title: 'Maritime Accident Lawyer', category: { slug: 'maritime-offshore-injury-law' } },
    'maritime-accident-lawyer', SITE,
  );
  assert.deepEqual(m.robots, { index: true, follow: true });
});

test('an article with no category stays indexable — the root-level guides have none', () => {
  const m = buildArticleMetadata(
    { title: 'Do I Need A Lawyer' }, 'do-i-need-a-lawyer', SITE,
  );
  assert.deepEqual(m.robots, { index: true, follow: true });
});

test('a legacy category slug is mapped before being judged', () => {
  // toNewCategorySlug() maps old slugs; a renamed-but-kept category must not
  // be de-indexed just because the CMS still stores its old name.
  const m = buildArticleMetadata(
    { title: 'Personal Injury', category: { slug: 'personal-injury-lawyer' } },
    'what-is-a-personal-injury-lawyer', SITE,
  );
  assert.deepEqual(m.robots, { index: true, follow: true });
});

/**
 * A contributor who exists only in the CMS — Ritwika Sharma, an advocate
 * enrolled with the Bar Council of Delhi, is one — used to resolve to null in
 * getAuthorByName (which searches the bundled roster only), so the article was
 * credited to the Organization. That erased the byline of exactly the
 * qualified authors worth surfacing on YMYL legal content.
 */
test('a CMS-only byline is credited as a Person with a live profile URL', () => {
  const ld = buildAuthorLd('Ritwika Sharma', SITE) as Record<string, string>;
  assert.equal(ld['@type'], 'Person');
  assert.equal(ld.name, 'Ritwika Sharma');
  assert.equal(ld.url, `${SITE}/author/ritwika-sharma`);
});

test('a bundled byline still resolves through the roster', () => {
  const ld = buildAuthorLd('Deepak Kumar Kuldeep', SITE) as Record<string, string>;
  assert.equal(ld['@type'], 'Person');
  assert.equal(ld.url, `${SITE}/author/deepak-kumar-kuldeep`);
});

test('no byline falls back to the Organization', () => {
  const ld = buildAuthorLd(undefined, SITE) as Record<string, string>;
  assert.equal(ld['@type'], 'Organization');
});

test('a byline that slugifies to nothing does not emit a broken profile link', () => {
  const ld = buildAuthorLd('   ', SITE) as Record<string, string>;
  assert.equal(ld['@type'], 'Organization');
});
