import { NextResponse } from 'next/server';
import { MARKETPLACE_PRODUCTS } from '@/data/mockData';

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return NextResponse.json(MARKETPLACE_PRODUCTS);
}
