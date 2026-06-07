import { NextResponse } from 'next/server';

// Seed board materials (standalone mode). Consumed by boardMaterialsApi.list → listOf(data).items.
export const dynamic = 'force-dynamic';

const MATERIALS = [
  {
    id: 'bm-1',
    title: 'Q1 2024 Board Pack',
    meeting_date: '2024-04-20',
    classification: 'Confidential',
    related_votes: ['vote-2024-03'],
    document_ids: [],
    workflow_status: 'Published',
    version_history: [],
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: { items: MATERIALS } });
}
