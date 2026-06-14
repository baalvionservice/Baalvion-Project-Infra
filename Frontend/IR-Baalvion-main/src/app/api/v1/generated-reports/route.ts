import { NextResponse } from 'next/server';

// Seed generated reports (standalone mode). Consumed by generatedReportsApi.list → listOf(data).items.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ success: true, data: { items: [] } });
}
