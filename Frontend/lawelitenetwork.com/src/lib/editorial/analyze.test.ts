import { test } from 'node:test';
import assert from 'node:assert';
import { analyzeDraft, gramsOf, keyOf, type Catalog } from './analyze';
import { insertLink, markdownToHtml, stripMarkdown } from './markdown';

const marbury = { entityType: 'legal-case', slug: 'marbury-v-madison' } as const;
const court = { entityType: 'court', slug: 'supreme-court-of-the-united-states' } as const;

const catalog = (): Catalog => ({
  entities: [
    { ref: marbury, label: 'Marbury v. Madison', names: ['Marbury v. Madison'], kind: 'Legal case', url: '/legal/cases/marbury-v-madison' },
    { ref: court, label: 'Supreme Court of the United States', names: ['Supreme Court of the United States'], kind: 'Court', url: '/legal/courts/supreme-court-of-the-united-states' },
  ],
  articles: [
    { slug: 'how-to-brief-a-case', title: 'How to Brief a Case: Annotated Examples', url: '/law-school-success/how-to-brief-a-case', entities: [marbury] },
    { slug: 'unrelated', title: 'Cooking pasta at home', url: '/x/unrelated', entities: [] },
  ],
  relations: new Map([[keyOf(marbury), [keyOf(court)]]]),
  grams: new Map(gramsOf('the quick brown fox jumps over the lazy dog every single morning without fail').map((g) => [g, 'old-article'])),
});

test('a named case is detected and offered as a link at its first plain mention', () => {
  const a = analyzeDraft({ title: 't', body: 'Today we look at Marbury v. Madison and why it matters.' }, catalog());
  assert.equal(a.entities[0].label, 'Marbury v. Madison');
  const s = a.links.find((l) => l.type === 'entity')!;
  assert.equal(s.href, '/legal/cases/marbury-v-madison');
  assert.equal(insertLink('Today we look at Marbury v. Madison and', s.index, s.length, s.href), 'Today we look at [Marbury v. Madison](/legal/cases/marbury-v-madison) and');
});

test('an already-linked entity is not suggested again, and headings are never linked', () => {
  const linked = analyzeDraft({ title: 't', body: 'See [Marbury v. Madison](/legal/cases/marbury-v-madison) here.' }, catalog());
  assert.equal(linked.links.filter((l) => l.type === 'entity').length, 0);
  const heading = analyzeDraft({ title: 't', body: '## Marbury v. Madison\n\nNo other mention.' }, catalog());
  assert.equal(heading.links.filter((l) => l.type === 'entity').length, 0);
  assert.equal(heading.entities.length, 1);
});

test('related articles come from shared entities or a title phrase, never from nothing', () => {
  const a = analyzeDraft({ title: 'New piece', body: 'A note on Marbury v. Madison and how to brief a case properly.' }, catalog());
  const art = a.links.filter((l) => l.type === 'article');
  assert.equal(art.length, 1);
  assert.equal(art[0].href, '/law-school-success/how-to-brief-a-case');
  assert.ok(art[0].index >= 0);
});

test('connected entities the draft leaves out are suggested', () => {
  const a = analyzeDraft({ title: 't', body: 'Marbury v. Madison changed everything.' }, catalog());
  assert.deepEqual(a.related.map((r) => r.label), ['Supreme Court of the United States']);
});

test('a country is tagged but never suggested as a link or as a reason to link an article', () => {
  const c = catalog();
  const us = { entityType: 'country', slug: 'US' } as const;
  c.entities.push({ ref: us, label: 'United States', names: ['United States'], kind: 'Country', url: '/countries/us' });
  c.articles.push({ slug: 'llc', title: 'LLC vs Corporation', url: '/x/llc', entities: [us] });
  const a = analyzeDraft({ title: 't', body: 'A note about the United States and nothing else.' }, c);
  assert.equal(a.entities.length, 1);
  assert.equal(a.links.length, 0);
});

test('a name only in the title or summary still counts as tagged, but cannot be linked there', () => {
  const a = analyzeDraft({ title: 'On Marbury v. Madison', excerpt: '', body: 'Nothing named in the body.' }, catalog());
  assert.equal(a.entities.length, 1);
  assert.equal(a.links.filter((l) => l.type === 'entity').length, 0);
});

test('naming a court does not offer every case it heard', () => {
  const c = catalog();
  c.relations = new Map([[keyOf(marbury), [keyOf(court)]]]);
  const a = analyzeDraft({ title: 't', body: 'The Supreme Court of the United States sits in Washington.' }, c);
  assert.equal(a.related.length, 0);
});

test('copying an existing article is caught', () => {
  const a = analyzeDraft({ title: 't', body: 'The quick brown fox jumps over the lazy dog every single morning without fail today.' }, catalog());
  assert.ok(a.originality.overlapPct > 15);
  assert.equal(a.originality.source, 'old-article');
  assert.equal(a.checks.find((c) => c.id === 'originality')!.level, 'error');
});

test('markdown export escapes markup and refuses unsafe links', () => {
  const html = markdownToHtml('## Title\n\nHello <script>alert(1)</script> [ok](/a) [bad](javascript:alert(1)) **bold**');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('<h2>Title</h2>'));
  assert.ok(html.includes('<a href="/a">ok</a>'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('<strong>bold</strong>'));
  assert.equal(stripMarkdown('[a](/x) **b**'), 'a b');
});
