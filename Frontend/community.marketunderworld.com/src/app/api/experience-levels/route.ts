
import { NextResponse } from 'next/server';
import { EXPERIENCE_LEVELS } from '@/lib/api-mock';

export async function GET() {
  return NextResponse.json(EXPERIENCE_LEVELS);
}
