import { NextResponse } from 'next/server';
import { requireStaff, noStore } from '@/lib/editorial/auth';
import { getPersonBrief } from '@/lib/editorial/brief';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const denied = await requireStaff(req);
  if (denied) return denied;
  const slug = new URL(req.url).searchParams.get('slug') || '';
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  const brief = await getPersonBrief(slug);
  return brief ? NextResponse.json(brief, { headers: noStore }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
