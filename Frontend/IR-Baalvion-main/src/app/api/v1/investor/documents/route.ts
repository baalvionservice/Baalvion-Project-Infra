import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/with-permission';

export const GET = withPermission('VIEW_DASHBOARD', async () => {
  return NextResponse.json({
    success: true,
    data: [
      {
        id: 'DOC-001',
        title: 'Q1 2024 Investor Report',
        category: 'FINANCIAL',
        restrictedTo: ['p1_institutional', 'admin'],
        version: '1.0',
      },
      {
        id: 'DOC-002',
        title: '2023 Audited Financial Statements',
        category: 'LEGAL',
        restrictedTo: ['p1_institutional', 'p2_spv', 'admin'],
        version: '2.1',
      },
      {
        id: 'DOC-003',
        title: 'Compliance Manual 2024',
        category: 'COMPLIANCE',
        restrictedTo: ['p1_institutional', 'p2_spv', 'p3_operator', 'admin'],
        version: '1.0',
      },
      {
        id: 'DOC-004',
        title: 'Project Alpha Performance Teaser',
        category: 'MARKETING',
        restrictedTo: [], // public
        version: '3.0',
      },
    ],
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  });
});
