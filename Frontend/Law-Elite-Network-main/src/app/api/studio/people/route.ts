import { NextResponse } from 'next/server';
import { requireStaff, noStore } from '@/lib/editorial/auth';
import { listPeopleForPicker } from '@/lib/editorial/brief';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const denied = await requireStaff(req);
  if (denied) return denied;
  return NextResponse.json({ people: await listPeopleForPicker() }, { headers: noStore });
}
