import { NextResponse } from 'next/server';
import { cmsAdminBase } from '@/lib/editorial/cms-save';

/**
 * Calls the CMS admin API with the EDITOR'S OWN bearer token, so the CMS
 * applies its own role checks (website membership, workflow levels). The
 * Studio holds no CMS credentials and cannot do anything the person could not
 * do in the CMS itself.
 */
export async function cmsCall(req: Request, path: string, init: { method?: string; body?: unknown } = {}) {
  const res = await fetch(`${cmsAdminBase()}${path}`, {
    method: init.method || 'GET',
    headers: { Authorization: req.headers.get('authorization') || '', 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res) return { ok: false as const, response: NextResponse.json({ error: 'The CMS is not reachable right now. Your draft is safe in this browser.' }, { status: 502 }) };

  const json = await res.json().catch(() => null);
  if (res.ok && json?.success !== false) return { ok: true as const, data: json?.data };

  const message = String(json?.error?.message || '');
  const friendly =
    res.status === 403 ? 'You do not have permission to write for this site in the CMS. Ask an admin to add you as an author.'
    : res.status === 401 ? 'Sign in again to save.'
    : res.status === 404 ? 'That article no longer exists in the CMS. Save again to create it as a new draft.'
    : message || 'The CMS rejected the article.';
  return { ok: false as const, response: NextResponse.json({ error: friendly }, { status: res.status === 404 ? 404 : res.status >= 500 ? 502 : res.status }) };
}
