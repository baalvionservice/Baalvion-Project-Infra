import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/with-permission';

export const GET = withPermission('VIEW_DASHBOARD', async () => {
  return NextResponse.json({
    success: true,
    data: {
      commitment: 10000000,
      calledCapital: 4500000,
      distributions: 1250000,
      nav: 12450000,
      irr: 18.4,
    },
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  });
});
