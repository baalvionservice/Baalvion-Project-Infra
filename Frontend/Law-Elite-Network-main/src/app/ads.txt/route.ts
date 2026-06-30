// Serves /ads.txt for Google AdSense. The publisher ID is read from
// NEXT_PUBLIC_ADSENSE_CLIENT (format: "ca-pub-XXXXXXXXXXXXXXXX"); ads.txt requires the
// bare numeric publisher ID, so we strip the "ca-pub-" prefix.
//
// When the env var is unset, we return an empty (but valid 200) ads.txt so crawlers get
// a clean response instead of a 404. Populate the env var once AdSense is approved.

export const dynamic = 'force-static';
export const revalidate = 86400; // re-evaluate daily

export function GET(): Response {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  const pubId = client?.replace(/^ca-pub-/i, '');

  const body = pubId
    ? `google.com, pub-${pubId}, DIRECT, f08c47fec0942fa0\n`
    : '# ads.txt — add your AdSense publisher line after approval.\n';

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
