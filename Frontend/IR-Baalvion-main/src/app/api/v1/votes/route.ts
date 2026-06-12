import { NextResponse } from 'next/server';

// Seed governance votes (standalone mode). Consumed by votingApi.list (ir-engagement.ts):
// irReq returns json.data, then listOf(data) reads data.items. Ungated read — the
// /governance/my-voting route is already gated by middleware.
export const dynamic = 'force-dynamic';

const VOTES = [
  {
    id: 'vote-2024-03',
    title: 'Resolution 2024-03 — Reinvestment Mandate',
    description: 'Authorize reinvestment of Q1 distributions into the Trade Finance SPV.',
    resolutionText:
      'RESOLVED, that the Fund is authorized to reinvest up to 50% of Q1 2024 distributions into the Trade Finance SPV, subject to the existing concentration limits.',
    createdByRole: 'admin',
    eligibleRoles: ['p1_institutional', 'p2_spv', 'p3_operator', 'admin'],
    status: 'Open',
    startDate: '2024-04-12T00:00:00.000Z',
    endDate: '2024-04-26T00:00:00.000Z',
    votes: [],
    versionHistory: [],
  },
  {
    id: 'vote-2024-02',
    title: 'Resolution 2024-02 — Auditor Appointment',
    description: 'Appoint the independent auditor for FY2024.',
    resolutionText:
      'RESOLVED, that the independent auditor is appointed for the financial year ending 2024.',
    createdByRole: 'admin',
    eligibleRoles: ['p1_institutional', 'p2_spv', 'p3_operator', 'admin'],
    status: 'Closed',
    startDate: '2024-02-01T00:00:00.000Z',
    endDate: '2024-02-15T00:00:00.000Z',
    votes: [
      { voterRole: 'p1_institutional', choice: 'Approve', timestamp: '2024-02-03T00:00:00.000Z' },
      { voterRole: 'p2_spv', choice: 'Approve', timestamp: '2024-02-04T00:00:00.000Z' },
      { voterRole: 'p3_operator', choice: 'Abstain', timestamp: '2024-02-05T00:00:00.000Z' },
    ],
    versionHistory: [],
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: { items: VOTES } });
}
