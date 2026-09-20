import { createHash } from 'crypto';
import { NextResponse } from 'next/server';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');

// The Studio calls the API on every pause in typing; re-asking law-service each time is wasteful.
const TTL_MS = 60_000;
const verdicts = new Map<string, { at: number; ok: boolean }>();

/**
 * Staff-only gate for the editorial API. The caller's own bearer token is
 * checked against law-service (/auth/me), and only an active admin passes:
 * the Studio holds no credentials of its own and cannot be used anonymously.
 * Returns a ready 401/403 response to send, or null when the caller may proceed.
 */
export async function requireStaff(req: Request): Promise<NextResponse | null> {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!/^https?:\/\//i.test(BASE_URL)) return NextResponse.json({ error: 'Auth service not configured' }, { status: 503 });

  const key = createHash('sha256').update(header).digest('hex');
  const hit = verdicts.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.ok ? null : NextResponse.json({ error: 'Not permitted' }, { status: 403 });

  const res = await fetch(`${BASE_URL}/auth/me`, { headers: { Authorization: header }, cache: 'no-store', signal: AbortSignal.timeout(5000) }).catch(() => null);
  if (!res || res.status === 401) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!res.ok) return NextResponse.json({ error: 'Could not verify your account' }, { status: 502 });

  const user = (await res.json())?.data;
  const ok = user?.role === 'admin' && user?.is_active !== false;
  verdicts.set(key, { at: Date.now(), ok });
  if (verdicts.size > 500) verdicts.clear();
  return ok ? null : NextResponse.json({ error: 'Not permitted' }, { status: 403 });
}

export const noStore = { 'Cache-Control': 'private, no-store' };
