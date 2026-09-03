import { type NextRequest, NextResponse } from 'next/server';

/**
 * Jobs Portal edge middleware.
 *
 * NOTE: the previous `src/proxy.ts` (function `proxy`) was NEVER executed by Next.js — middleware
 * MUST be `middleware.ts` exporting `middleware`. This file replaces it so the edge gate actually runs.
 *
 * SECURITY MODEL (P0): the access token is in memory; the edge gates on the un-forgeable httpOnly
 * `baalvion_refresh` cookie set by auth-service. Jobs is a hybrid public-board / private-portal app,
 * so per-route + per-role enforcement is done by the client guards (ProtectedRoute / RoleGuard driven
 * by the AuthProvider silent-refresh bootstrap) and decisively at the API. Middleware here is a
 * defense-in-depth presence gate on the unambiguous authenticated area (/dashboard).
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';
const PROTECTED_PREFIXES = ['/dashboard'];

const JOBS_SERVICE =
  process.env.NEXT_PUBLIC_JOBS_SERVICE_URL || 'https://api.baalvion.com/api/v1/ecosystem/jobs/api/v1';

// Every URL shape a job has ever had:
//   /job/42, /careers/job/42                    — the original single-segment links
//   /careers/countries/india/jobs/42            — the country-scoped shape
// All of them 308 to /careers/jobs/<place>/<role-slug>-42.
const LEGACY_JOB_PATH = /^\/(?:careers\/)?job\/([^/]+)\/?$/;
const COUNTRY_JOB_PATH = /^\/careers\/countries\/[^/]+\/jobs\/(\d+)\/?$/;
// The current shape. Matched so a stale slug or place — a retitled role, or one that
// moved town — is corrected with a real redirect rather than served at two URLs.
const CANONICAL_JOB_PATH = /^\/careers\/jobs\/([^/]+)\/(.+?-(\d+))\/?$/;

const slugifyRole = (title: string) =>
  String(title)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

/**
 * 308 an old job URL onto its canonical /careers/jobs/<place>/<role-slug>-<id>.
 *
 * This has to happen in middleware. `redirect()` from the page itself comes back as a
 * 200 carrying `<meta http-equiv="refresh">`, which search engines read as a thin
 * duplicate rather than a permanent move — so both URLs stay indexed and split the
 * ranking signals for the same role. Middleware answers before any rendering, so the
 * redirect is a real one.
 */
async function redirectLegacyJobUrl(request: NextRequest, jobId: string) {
  try {
    const res = await fetch(`${JOBS_SERVICE}/jobs/${jobId}`, {
      signal: AbortSignal.timeout(2500),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const job = (await res.json())?.data;
    if (!job?.title) return null;

    // Prefer the town the job resolved to; fall back to its country, which always has
    // a page. Mirrors lib/job-url so both sides agree on where a job lives.
    let place: string | null = job.place_slug ?? job.placeSlug ?? null;
    if (!place) {
      const countryId: string | undefined = job.country_id ?? job.countryId;
      const countriesRes = await fetch(`${JOBS_SERVICE}/countries`, {
        signal: AbortSignal.timeout(2500),
        headers: { accept: 'application/json' },
      });
      if (countriesRes.ok) {
        const countries = (await countriesRes.json())?.data ?? [];
        place = countries.find((c: any) => c.id === countryId)?.slug ?? null;
      }
    }
    if (!place) return null;

    const target = `/careers/jobs/${place}/${slugifyRole(job.title)}-${jobId}`;
    return NextResponse.redirect(new URL(target, request.url), 308);
  } catch {
    // Backend unreachable — fall through and let the page render its own fallback
    // rather than 308-ing a visitor somewhere wrong.
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyJob = pathname.match(LEGACY_JOB_PATH) ?? pathname.match(COUNTRY_JOB_PATH);
  if (legacyJob) {
    const redirect = await redirectLegacyJobUrl(request, legacyJob[1]);
    if (redirect) return redirect;
  }

  // Already on the canonical shape — but check the slug still matches the record.
  // `redirect()` from the page itself only produces a meta refresh, so this correction
  // has to happen here to be a real 308.
  const canonicalJob = pathname.match(CANONICAL_JOB_PATH);
  if (canonicalJob) {
    const redirect = await redirectLegacyJobUrl(request, canonicalJob[3]);
    if (redirect && new URL(redirect.headers.get('location') || '', request.url).pathname !== pathname) {
      return redirect;
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isProtected && !request.cookies.get(REFRESH_COOKIE)?.value) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  matcher: [
    '/((?!api|auth-bff|_next/static|_next/image|favicon.ico).*)',
  ],
};
