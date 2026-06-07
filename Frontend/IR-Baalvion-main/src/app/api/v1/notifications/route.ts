import { NextResponse } from 'next/server';

// Seed notifications log (standalone mode). Consumed by notificationsApi.list → listOf(data).items.
export const dynamic = 'force-dynamic';

const NOTIFICATIONS = [
  {
    id: 'ntf-1',
    title: 'Q1 2024 NAV Published',
    message: 'The Q1 2024 NAV statement has been distributed to all eligible investors.',
    module_source: 'Performance',
    target_roles: ['p1_institutional', 'p2_spv', 'p3_operator'],
    status: 'Sent',
    sent_at: '2024-04-15T09:00:00.000Z',
    delivery_stats: { delivered: 128, opened: 96 },
    version_history: [],
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: { items: NOTIFICATIONS } });
}
