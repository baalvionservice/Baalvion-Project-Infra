import { NextResponse } from 'next/server';
import { requireStaff, noStore } from '@/lib/editorial/auth';
import { getEditorialCatalog } from '@/lib/editorial/context';
import { analyzeDraft } from '@/lib/editorial/analyze';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY = 200_000;

export async function POST(req: Request) {
  const denied = await requireStaff(req);
  if (denied) return denied;

  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: 'Draft too large' }, { status: 413 });
  let draft: { title?: unknown; body?: unknown; excerpt?: unknown };
  try { draft = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const analysis = analyzeDraft({ title: str(draft.title), body: str(draft.body), excerpt: str(draft.excerpt) }, await getEditorialCatalog());
  return NextResponse.json(analysis, { headers: noStore });
}
