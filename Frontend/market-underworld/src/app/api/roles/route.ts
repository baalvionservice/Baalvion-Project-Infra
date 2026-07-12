
import { NextResponse } from 'next/server';
import { ROLES } from '@/lib/api-mock';

export async function GET() {
  return NextResponse.json(ROLES);
}
