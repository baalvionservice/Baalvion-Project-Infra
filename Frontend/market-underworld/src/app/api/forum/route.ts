
import { NextResponse } from 'next/server';
import { FORUM_THREADS } from '@/lib/api-mock';

export async function GET() {
  return NextResponse.json(FORUM_THREADS);
}
