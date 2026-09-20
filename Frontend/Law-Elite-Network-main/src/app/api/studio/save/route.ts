import { NextResponse } from 'next/server';
import { requireStaff, noStore } from '@/lib/editorial/auth';
import { cmsCall } from '@/lib/editorial/cms-client';
import { buildContentPayload, UUID_RE, validateSave } from '@/lib/editorial/cms-save';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY = 250_000;

/**
 * Saves the draft to the CMS as a DRAFT. First save creates the article and
 * returns its id; later saves send that id and update it in place (a second
 * "create" would silently make a duplicate with a -2 slug). Publishing is
 * never done from here: an editor publishes in the CMS.
 */
export async function POST(req: Request) {
  const denied = await requireStaff(req);
  if (denied) return denied;

  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: 'Draft too large' }, { status: 413 });
  let input: Record<string, unknown>;
  try { input = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const s = (v: unknown) => (typeof v === 'string' ? v : '');
  const save = { title: s(input.title), excerpt: s(input.excerpt), body: s(input.body), categoryId: s(input.categoryId), author: s(input.author), slug: s(input.slug) || undefined };
  const problem = validateSave(save);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const cmsId = s(input.cmsId);
  if (cmsId && !UUID_RE.test(cmsId)) return NextResponse.json({ error: 'Invalid article id' }, { status: 400 });

  const r = cmsId
    ? await cmsCall(req, `/content/${cmsId}`, { method: 'PATCH', body: buildContentPayload(save, true) })
    : await cmsCall(req, '/content', { method: 'POST', body: buildContentPayload(save, false) });
  if (!r.ok) return r.response;

  const row = r.data as { id: string; slug: string; status: string };
  return NextResponse.json({ id: row.id, slug: row.slug, status: row.status, created: !cmsId }, { headers: noStore });
}
