import { test, expect, request } from '@playwright/test';

/**
 * CanWeMarry — HTTP semantics for unknown resources.
 *
 * These exist because the app spent several iterations answering **200** for every unknown
 * case, community, profile and resource. The rendered page was right and nothing leaked, but
 * the status was a lie, and monitoring and crawlers believe the status.
 *
 * The cause was a `loading.tsx` in an ancestor segment: it puts the route behind a Suspense
 * boundary, Next streams the shell — committing 200 — and resolves the page afterwards, so a
 * later `notFound()` can only swap the UI. Proven by removing the boundaries and by a bare
 * Next 15.5.21 app, which answers 404 correctly with none. See
 * `Frontend/CanWeMarry-main/src/app/ROUTE_LOADING_BOUNDARIES.md`.
 *
 * The second half is the mirror image: after the fix, `if (!result.ok) notFound()` started
 * reporting a stopped backend as "not found". A missing thing and an unreachable service are
 * different answers and must stay different.
 *
 * Run against a PRODUCTION build (`next build && next start`) — `next dev` does not stream
 * the same way, so a dev server can pass while production is wrong.
 */

const BASE = process.env.CANWEMARRY_URL ?? 'http://localhost:3071';

const UNKNOWN = [
  ['case', '/cases/00000000-0000-4000-8000-000000000000'],
  ['community', '/community/zz-no-such-community'],
  ['profile', '/profiles/zz-no-such-person'],
  ['resource', '/resources/zz-no-such-resource'],
  // Static, prerendered from generateStaticParams with dynamicParams=false. It is in this
  // list because "the route is static so it cannot regress" is exactly the assumption that a
  // `loading.tsx` added to /app or /app/guides would quietly break.
  ['guide', '/guides/zz-no-such-guide'],
] as const;

test.describe('an unknown resource answers 404', () => {
  for (const [label, path] of UNKNOWN) {
    test(`GET an unknown ${label}`, async () => {
      const api = await request.newContext();
      const res = await api.get(`${BASE}${path}`, { maxRedirects: 0 });
      expect(res.status(), `GET ${path}`).toBe(404);
      await api.dispose();
    });

    test(`HEAD an unknown ${label}`, async () => {
      // A HEAD must agree with its GET; a crawler or uptime check may only send HEAD.
      const api = await request.newContext();
      const res = await api.head(`${BASE}${path}`, { maxRedirects: 0 });
      expect(res.status(), `HEAD ${path}`).toBe(404);
      await api.dispose();
    });
  }

  test('a malformed identifier is 404 too, not 500', async () => {
    // The service refuses a path parameter that cannot be a uuid, with the same answer a
    // well-formed unknown one gets — so the shape of an id is not an oracle.
    const api = await request.newContext();
    for (const path of ['/cases/not-a-uuid', '/cases/..%2F..%2Fetc%2Fpasswd']) {
      expect((await api.get(`${BASE}${path}`, { maxRedirects: 0 })).status(), path).toBe(404);
    }
    await api.dispose();
  });

  test('an unknown top-level route is 404', async () => {
    const api = await request.newContext();
    expect((await api.get(`${BASE}/zz-no-such-route`, { maxRedirects: 0 })).status()).toBe(404);
    await api.dispose();
  });
});

test.describe('a page that renders still answers 200', () => {
  // Listing pages need no fixture and exercise the same layout, so they catch an over-broad
  // 404 without depending on seeded content.
  for (const path of ['/', '/cases', '/community', '/resources', '/safety', '/guides']) {
    test(`GET ${path}`, async () => {
      const api = await request.newContext();
      expect((await api.get(`${BASE}${path}`, { maxRedirects: 0 })).status(), path).toBe(200);
      await api.dispose();
    });
  }
});

test.describe('the guides are the one thing here meant to be found', () => {
  // The inverse of every other test in this file. Guides are platform writing, they are the
  // only public reading surface, and a noindex on them — or a 404 — would be the failure.
  const SLUGS = [
    'marry-without-converting',
    'the-courts-already-decided',
    'if-it-stops-being-safe',
    'the-first-conversation',
    'what-a-supporter-does',
    'which-marriage-act-applies',
    'inter-caste-marriage-support-schemes',
    'living-together-before-marriage',
    'when-the-police-get-involved',
    'when-the-answer-stays-no',
  ];

  for (const slug of SLUGS) {
    test(`GET /guides/${slug} is 200 and indexable`, async () => {
      const api = await request.newContext();
      const res = await api.get(`${BASE}/guides/${slug}`, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
      expect(await res.text(), 'guides must not carry the platform-wide noindex').not.toMatch(/noindex/);
      await api.dispose();
    });
  }

  test('every guide is in the sitemap', async () => {
    const api = await request.newContext();
    const xml = await (await api.get(`${BASE}/sitemap.xml`)).text();
    for (const slug of SLUGS) expect(xml, slug).toContain(`/guides/${slug}`);
    await api.dispose();
  });

  test('nothing canonicalises itself to localhost', async () => {
    /*
     * A `NEXT_PUBLIC_*` value is inlined at BUILD time, so setting the origin on a running
     * container does nothing — and prerendered guide pages bake their canonical URL besides.
     * A build that missed the origin publishes a site whose every canonical points at
     * localhost, which looks perfectly fine in a browser and is unindexable.
     *
     * Skipped when the suite itself is pointed at localhost, which is the normal local run.
     */
    test.skip(/localhost|127\.0\.0\.1/.test(BASE), 'running against a local origin');
    const api = await request.newContext();
    const html = await (await api.get(`${BASE}/guides/${SLUGS[0]}`)).text();
    expect(html).not.toMatch(/rel="canonical" href="https?:\/\/(localhost|127\.0\.0\.1)/);
    await api.dispose();
  });

  test('the guides carry Article structured data', async () => {
    // The reason the page exists is to be found; a rich result needs the markup to parse.
    const api = await request.newContext();
    const html = await (await api.get(`${BASE}/guides/${SLUGS[0]}`)).text();
    const block = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    expect(block, 'no JSON-LD on a guide page').not.toBeNull();
    const parsed = JSON.parse(block![1]!);
    const types = (parsed['@graph'] ?? [parsed]).map((n: { '@type': string }) => n['@type']);
    expect(types).toContain('Article');
    expect(types).toContain('BreadcrumbList');
    await api.dispose();
  });
});

test.describe('an unknown resource leaks nothing', () => {
  test('the body carries no SQL, stack trace or filesystem path', async () => {
    const api = await request.newContext();
    const res = await api.get(`${BASE}${UNKNOWN[0][1]}`, { maxRedirects: 0 });
    const body = await res.text();
    expect(body).not.toMatch(/SELECT |INSERT INTO|sequelize/i);
    expect(body).not.toMatch(/\/Users\/|\/home\/|node_modules/);
    expect(body).not.toMatch(/\bat \w+ \([^)]*\.js:\d+/);
    await api.dispose();
  });

  test('two different unknown ids give byte-identical answers', async () => {
    /*
     * The property that actually matters, and it is not "the id is absent from the body":
     * the id appears in the RSC router state because it is the URL the CLIENT asked for, and
     * echoing somebody their own request discloses nothing.
     *
     * What would be a disclosure is the answer DIFFERING between an id that does not exist
     * and one that exists but is not this reader's to see — that difference is an enumeration
     * oracle, and it is exactly what the service's decision to answer 404 rather than 403 for
     * a private case exists to prevent. Normalising the id out of both bodies and comparing
     * checks that end to end.
     */
    const api = await request.newContext();
    const bodyFor = async (id: string) =>
      (await (await api.get(`${BASE}/cases/${id}`, { maxRedirects: 0 })).text()).split(id).join('<ID>');

    const a = await bodyFor('00000000-0000-4000-8000-000000000000');
    const b = await bodyFor('11111111-1111-4111-8111-111111111111');
    expect(a).toBe(b);
    await api.dispose();
  });

  test('it stays out of the index', async () => {
    const api = await request.newContext();
    const res = await api.get(`${BASE}${UNKNOWN[1][1]}`, { maxRedirects: 0 });
    expect(await res.text()).toMatch(/noindex/);
    await api.dispose();
  });
});
