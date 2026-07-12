
import { NextResponse } from 'next/server';
import { PREMIUM_PLANS } from '@/lib/api-mock';

export async function GET() {
  return NextResponse.json(PREMIUM_PLANS);
}
