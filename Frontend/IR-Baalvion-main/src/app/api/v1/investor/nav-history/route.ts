import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/with-permission';

export const GET = withPermission('VIEW_DASHBOARD', async () => {
  return NextResponse.json({
    success: true,
    data: [
      { date: '2022-Q1', nav: 10000000 },
      { date: '2022-Q2', nav: 10250000 },
      { date: '2022-Q3', nav: 10500000 },
      { date: '2022-Q4', nav: 10800000 },
      { date: '2023-Q1', nav: 11100000 },
      { date: '2023-Q2', nav: 11450000 },
      { date: '2023-Q3', nav: 11900000 },
      { date: '2023-Q4', nav: 12200000 },
      { date: '2024-Q1', nav: 12450000 },
    ],
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  });
});
