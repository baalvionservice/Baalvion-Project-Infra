/**
 * One-off / on-demand bulk IndexNow submission.
 *
 * The publish webhook (src/app/api/revalidate/route.ts) already pings IndexNow
 * for URLs that change *after* this ships, but Bing/Yandex/etc. never got a
 * push for the site's existing, already-published URLs -- they'd otherwise
 * wait on ordinary crawl discovery. Run this once (and any time a large batch
 * of content needs to jump the crawl queue) to submit every URL in the live
 * sitemap.
 *
 * Usage:
 *   INDEXNOW_KEY=... pnpm run submit:indexnow
 *   INDEXNOW_KEY=... SITE_URL=https://lawelitenetwork.com pnpm run submit:indexnow
 *
 * The key must match a public/{key}.txt file already deployed at
 * https://{host}/{key}.txt (IndexNow's ownership proof) -- see public/*.txt.
 */
const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com').replace(/\/$/, '');
const KEY = process.env.INDEXNOW_KEY?.trim();
const BATCH_SIZE = 10000; // IndexNow's documented max urlList length per request.

function extractLocs(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    urls.push(match[1].trim());
  }
  return urls;
}

async function fetchSitemapUrls(path: string): Promise<string[]> {
  const res = await fetch(`${SITE_URL}${path}`);
  if (!res.ok) {
    console.warn(`  skip ${path}: HTTP ${res.status}`);
    return [];
  }
  return extractLocs(await res.text());
}

async function main(): Promise<void> {
  if (!KEY) {
    console.error('INDEXNOW_KEY is not set -- nothing to do. Generate one and deploy public/{key}.txt first.');
    process.exitCode = 1;
    return;
  }

  console.log(`Fetching sitemap URLs from ${SITE_URL} ...`);
  const [sitemapUrls, newsUrls] = await Promise.all([
    fetchSitemapUrls('/sitemap.xml'),
    fetchSitemapUrls('/news-sitemap.xml'),
  ]);
  const urls = Array.from(new Set([...sitemapUrls, ...newsUrls]));

  if (!urls.length) {
    console.error('No URLs found in the sitemap(s) -- aborting rather than submitting nothing.');
    process.exitCode = 1;
    return;
  }

  const host = new URL(SITE_URL).host;
  console.log(`Submitting ${urls.length} URLs to IndexNow for ${host} ...`);

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key: KEY,
        keyLocation: `${SITE_URL}/${KEY}.txt`,
        urlList: batch,
      }),
    });
    // IndexNow returns 200/202 on success; 200 if some URLs were already seen.
    console.log(`  batch ${i / BATCH_SIZE + 1}: ${batch.length} URLs -> HTTP ${res.status}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
