/**
 * CMS <-> bundled article sync PLAN. Read-only: it sends GET requests to a LOCAL
 * CMS and writes files under content-plan/cms-sync/. It never writes to the CMS.
 *
 * Why it exists: the site serves a CMS article's text instead of the bundled
 * article with the same slug (src/lib/article-fetch.ts), so a corrected bundled
 * article stays hidden while an older CMS copy exists. This lists which CMS
 * records differ from the bundled text and exports the corrected content in the
 * shape the CMS stores (one html block + customFields.citations), so an editor
 * can apply it deliberately through the admin panel or an approved import.
 *
 * Run:  CMS_PUBLIC_URL=http://localhost:3018/api/v1/public pnpm run cms:sync-plan
 * It refuses any non-local CMS URL.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const base = process.env.CMS_PUBLIC_URL?.trim() || '';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(base)) {
  console.error('Refusing to run: set CMS_PUBLIC_URL to a LOCAL CMS (localhost / 127.0.0.1).');
  process.exit(1);
}

const plain = (html: string) =>
  html
    .replace(/<li>/g, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&rsquo;|&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[“”]/g, '"')
    .replace(/’/g, "'")
    .replace(/\\'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
const sentences = (t: string) =>
  new Set(
    t.split(/(?<=[.!?])\s+/)
      .map((s) => s.toLowerCase().replace(/[^a-z0-9$%£€ ]/g, '').replace(/\s+/g, ' ').trim())
      .filter((s) => s.length > 25),
  );

async function main(): Promise<void> {
  const { cmsGetArticles, cmsGetArticleBySlug } = await import('../src/lib/cms');
  const { getArticleBySlug } = await import('../src/data/law-content');
  const outDir = join(__dirname, '..', 'content-plan', 'cms-sync');
  mkdirSync(outDir, { recursive: true });

  const rows: string[] = [];
  for (const item of await cmsGetArticles()) {
    const cms = await cmsGetArticleBySlug(item.slug, true);
    const bundled = getArticleBySlug(item.slug);
    if (!cms || !bundled) {
      rows.push(`${item.slug}: ${bundled ? 'CMS record unreadable' : 'no bundled article with this slug (not compared)'}`);
      continue;
    }
    const c = sentences(plain(cms.content));
    const b = sentences(plain(bundled.content));
    const cmsOnly = [...c].filter((s) => !b.has(s)).length;
    const bundledOnly = [...b].filter((s) => !c.has(s)).length;
    const textDiffers = cmsOnly > 0 || bundledOnly > 0;
    const sourcesDiffer = (cms.primarySources?.length || 0) !== (bundled.primarySources?.length || 0);
    rows.push(
      `${item.slug}: ${textDiffers ? 'TEXT DIFFERS' : 'text identical'} (CMS-only sentences ${cmsOnly}, bundled-only ${bundledOnly})` +
        `; title ${cms.title === bundled.title ? 'same' : 'differs'}; CMS citations ${cms.primarySources?.length || 0} vs bundled ${bundled.primarySources?.length || 0}`,
    );
    if (textDiffers || sourcesDiffer) {
      writeFileSync(
        join(outDir, `${item.slug}.json`),
        JSON.stringify(
          {
            note: 'Proposed CMS update from the bundled article. Not applied. Review before use; category, author and status are intentionally omitted.',
            cmsId: cms.id,
            slug: item.slug,
            title: bundled.title,
            excerpt: bundled.summary,
            contentBlocks: [{ type: 'html', order: 0, content: { html: bundled.content } }],
            customFields: {
              citations: (bundled.primarySources || []).map((s) => ({ title: s.label, ...(s.url ? { url: s.url } : {}) })),
            },
            reason: textDiffers ? 'bundled text was corrected after the CMS copy was made' : 'bundled has citations the CMS record lacks',
          },
          null,
          2,
        ),
      );
    }
  }
  writeFileSync(join(outDir, 'REPORT.txt'), rows.join('\n') + '\n');
  console.log(rows.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
