import { NextResponse } from 'next/server';
import { getSimulatedStats } from '@/lib/simulation-engine';

export async function GET() {
  const stats = getSimulatedStats();
  return NextResponse.json(stats);
}
