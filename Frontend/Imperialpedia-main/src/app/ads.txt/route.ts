// Serves /ads.txt for Google AdSense. The publisher ID is managed in the CMS admin
// panel (Website → SEO → Monetization) and resolved via getSiteAdsenseClient, which
// falls back to NEXT_PUBLIC_ADSENSE_CLIENT. ads.txt needs the bare numeric publisher
// ID, so we strip the "ca-pub-" prefix.
//
// When no valid ID is configured, we return an empty (but valid 200) ads.txt so
// crawlers get a clean response instead of a 404. Set the ID in the admin panel once
// AdSense is approved — no redeploy needed.

import { getSiteAdsenseClient } from '@/services/data/cms-public';

// Revalidate daily; getSiteAdsenseClient itself caches the CMS read for an hour.
export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const client = await getSiteAdsenseClient();
  const pubId = client?.replace(/^ca-pub-/i, '');

  const body = pubId
    ? `google.com, pub-${pubId}, DIRECT, f08c47fec0942fa0\n`
    : '# ads.txt — add your AdSense publisher line after approval.\n';

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
