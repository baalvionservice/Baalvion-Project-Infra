import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/with-permission';

export const GET = withPermission('VIEW_DASHBOARD', async () => {
  return NextResponse.json({
    success: true,
    data: [
      {
        id: 'VOTE-2024-01',
        title: 'Re-election of Board Directors',
        deadline: '2024-05-01',
        status: 'OPEN',
      },
      {
        id: 'VOTE-2023-04',
        title: 'Amendment to Operating Agreement',
        deadline: '2023-12-10',
        status: 'CLOSED',
      },
    ],
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  });
});
