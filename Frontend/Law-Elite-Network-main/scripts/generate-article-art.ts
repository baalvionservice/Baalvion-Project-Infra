/**
 * Generates one real, crawlable PNG per bundled article into public/article-art/.
 *
 * Social crawlers (Facebook/Twitter/Google News) need a real raster og:image /
 * NewsArticle.image URL — the inline SVG data-URI previously used as a fallback
 * is not reliably accepted for those. Run via `pnpm run generate:article-art`
 * (wired as a `prebuild` step) so the files exist before `next build`/`next dev`.
 *
 * Output is keyed by `slug` (stable, unique, already used in the article URL),
 * generated deterministically from each article's imageSeed/title/category —
 * safe to re-run any time; it just overwrites with the same output.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { writeArticleArtRaster } from '@baalvion/illustrations';
import { getAllArticles } from '../src/data/law-content';

async function main(): Promise<void> {
  const outDir = join(__dirname, '..', 'public', 'article-art');
  mkdirSync(outDir, { recursive: true });

  const articles = getAllArticles();
  let count = 0;
  for (const article of articles) {
    const outPath = join(outDir, `${article.slug}.png`);
    await writeArticleArtRaster(
      {
        title: article.title,
        category: article.category?.name,
        seed: article.imageSeed || article.slug,
      },
      outPath,
    );
    count += 1;
  }

  // src/lib/article-art.ts needs only the slug set, and importing the whole
  // article corpus there put ~240 kB gzipped of article bodies in the client
  // bundle of every page that renders a story card.
  writeFileSync(
    join(__dirname, '..', 'src', 'data', 'bundled-article-slugs.json'),
    JSON.stringify(articles.map((a) => a.slug).sort(), null, 2) + '\n',
  );

  console.log(`Generated ${count} article art PNGs into ${outDir}`);
}

main().catch((err) => {
  console.error('generate-article-art failed:', err);
  process.exit(1);
});
