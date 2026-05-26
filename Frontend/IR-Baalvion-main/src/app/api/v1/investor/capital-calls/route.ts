import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/with-permission';

export const GET = withPermission('VIEW_DASHBOARD', async () => {
  return NextResponse.json({
    success: true,
    data: [
      {
        id: 'CC-2024-003',
        callDate: '2024-03-15',
        dueDate: '2024-03-30',
        amount: 1500000,
        status: 'PAID',
      },
      {
        id: 'CC-2023-002',
        callDate: '2023-11-10',
        dueDate: '2023-11-25',
        amount: 2000000,
        status: 'PAID',
      },
      {
        id: 'CC-2023-001',
        callDate: '2023-06-05',
        dueDate: '2023-06-20',
        amount: 1000000,
        status: 'PAID',
      },
    ],
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  });
});
