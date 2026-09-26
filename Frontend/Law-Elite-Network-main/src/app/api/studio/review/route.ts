import { NextResponse } from 'next/server';
import { requireStaff, noStore } from '@/lib/editorial/auth';
import { cmsCall } from '@/lib/editorial/cms-client';
import { UUID_RE } from '@/lib/editorial/cms-save';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Moves a saved draft into the CMS review queue. The only workflow step the Studio can take: approving and publishing stay with editors. */
export async function POST(req: Request) {
  const denied = await requireStaff(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const id = typeof body.cmsId === 'string' ? body.cmsId : '';
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Save the draft first.' }, { status: 400 });

  const r = await cmsCall(req, `/content/${id}/workflow/transition`, { method: 'POST', body: { action: 'submit_for_review', notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null } });
  if (!r.ok) return r.response;
  return NextResponse.json({ state: (r.data as { currentState?: string })?.currentState ?? 'pending_review' }, { headers: noStore });
}
