import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/with-permission';

// Seed investor alerts feed (standalone mode). Consumed by alertApi.list (api-client.ts):
// envelope { success, data: InvestorAlert[] }.
const ALERTS = [
  {
    id: 'al-1',
    title: 'Q1 2024 NAV Published',
    message: 'The Q1 2024 Net Asset Value statement is now available in the data room.',
    category: 'Performance',
    priority: 'High' as const,
    timestamp: '2024-04-15T09:00:00.000Z',
    read: false,
    actionUrl: '/dashboard',
  },
  {
    id: 'al-2',
    title: 'New Resolution Open for Voting',
    message: 'Resolution 2024-03 (Reinvestment Mandate) is now open. Voting closes in 7 days.',
    category: 'Governance',
    priority: 'High' as const,
    timestamp: '2024-04-12T14:30:00.000Z',
    read: false,
    actionUrl: '/governance/my-voting',
  },
  {
    id: 'al-3',
    title: 'Capital Call #4 Issued',
    message: 'A new capital call of $1.2M has been issued. Due date: 30 days.',
    category: 'Capital',
    priority: 'Medium' as const,
    timestamp: '2024-04-08T11:00:00.000Z',
    read: true,
    actionUrl: '/capital-ops',
  },
  {
    id: 'al-4',
    title: 'Investor Day 2024 Registration',
    message: 'Registration for the annual Investor Day is now open.',
    category: 'Events',
    priority: 'Low' as const,
    timestamp: '2024-04-01T08:00:00.000Z',
    read: true,
    actionUrl: '/news-and-events/investor-day',
  },
];

export const GET = withPermission('VIEW_DASHBOARD', async (req) => {
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
  const data = unreadOnly ? ALERTS.filter((a) => !a.read) : ALERTS;
  return NextResponse.json({ success: true, data });
});
