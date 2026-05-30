/* Extract the static glossary terms into entity-row JSON for imperialpedia-service to seed
   (type='term', attributes = full Term). Run from the frontend dir: npx tsx scripts/extract-terms.ts */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { terms } from '../src/lib/data/terms';

const rows = terms.map((t) => ({
  type: 'term',
  name: t.title,
  slug: t.slug,
  description: t.seoDescription ?? '',
  category: (t.categoryNames as string) ?? 'Glossary',
  image: t.featuredImageUrl ?? null,
  tags: t.relatedTerms ?? [],
  attributes: t, // full Term (content blocks, author, seo, etc.)
}));

const out = resolve(
  process.cwd(),
  '../../Backend/services/knowledge/imperialpedia-service/scripts/_terms_entities.json',
);
writeFileSync(out, JSON.stringify(rows, null, 2));
console.log(`wrote ${rows.length} terms -> ${out}`);
