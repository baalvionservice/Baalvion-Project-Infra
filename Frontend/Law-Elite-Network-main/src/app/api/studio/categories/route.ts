import { NextResponse } from 'next/server';
import { requireStaff, noStore } from '@/lib/editorial/auth';
import { cmsCall } from '@/lib/editorial/cms-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const denied = await requireStaff(req);
  if (denied) return denied;
  const r = await cmsCall(req, '/categories');
  if (!r.ok) return r.response;
  const list = (Array.isArray(r.data) ? r.data : r.data?.items ?? []) as { id: string; name: string; slug: string; parentId?: string | null }[];
  // Top-level practice areas only: sub-topics are set in the CMS.
  return NextResponse.json(
    { categories: list.filter((c) => !c.parentId).map((c) => ({ id: c.id, name: c.name, slug: c.slug })) },
    { headers: noStore },
  );
}
