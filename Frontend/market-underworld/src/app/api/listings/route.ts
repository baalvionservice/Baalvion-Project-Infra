import { NextResponse } from 'next/server';
import { MARKETPLACE_PRODUCTS } from '@/data/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const category = searchParams.get('category');
  const query = searchParams.get('q');
  
  // Simulate network protocol handshake delay
  await new Promise(resolve => setTimeout(resolve, 400));

  let filtered = [...MARKETPLACE_PRODUCTS];

  if (country && country !== 'all') {
    filtered = filtered.filter(p => p.country.toLowerCase() === country.toLowerCase());
  }
  
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category.toLowerCase().replace(/ /g, '') === category.toLowerCase());
  }
  
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.seller.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    meta: {
      total: filtered.length,
      page: 1,
      limit: 20
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Logic for creating a dynamic listing
  return NextResponse.json({
    success: true,
    listing_id: 'L-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    message: "Listing published to dynamic registry. Awaiting node audit."
  });
}