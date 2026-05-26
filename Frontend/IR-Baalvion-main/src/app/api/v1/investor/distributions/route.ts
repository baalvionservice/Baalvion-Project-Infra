import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/with-permission';

export const GET = withPermission('VIEW_DASHBOARD', async () => {
  return NextResponse.json({
    success: true,
    data: [
      {
        id: 'DIST-2024-01',
        date: '2024-02-20',
        type: 'INCOME',
        amount: 750000,
        wireStatus: 'PROCESSED',
      },
      {
        id: 'DIST-2023-02',
        date: '2023-12-15',
        type: 'RETURN_OF_CAPITAL',
        amount: 500000,
        wireStatus: 'PROCESSED',
      },
    ],
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  });
});
