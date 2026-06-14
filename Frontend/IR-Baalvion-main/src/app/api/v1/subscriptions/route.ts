import { NextResponse } from 'next/server';

// Seed notification subscriptions, one per access tier (standalone mode). Consumed by
// subscriptionsApi.list (ir-engagement.ts) → listOf(data).items.
export const dynamic = 'force-dynamic';

const PREFS = { News: true, Governance: true, Voting: true, DataRoom: true };

const SUBSCRIPTIONS = [
  { id: 'sub-p1', role: 'p1_institutional', email: 'institutional@baalvion.com', preferences: PREFS, active: true },
  { id: 'sub-p2', role: 'p2_spv', email: 'spv@baalvion.com', preferences: PREFS, active: true },
  { id: 'sub-p3', role: 'p3_operator', email: 'operator@baalvion.com', preferences: PREFS, active: true },
  { id: 'sub-admin', role: 'admin', email: 'admin@baalvion.com', preferences: PREFS, active: true },
  { id: 'sub-compliance', role: 'compliance', email: 'compliance@baalvion.com', preferences: PREFS, active: true },
];

export async function GET() {
  return NextResponse.json({ success: true, data: { items: SUBSCRIPTIONS } });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    data: { id: `sub-${Date.now()}`, preferences: PREFS, active: true, ...body },
  });
}
